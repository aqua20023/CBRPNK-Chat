const mongoose = require('mongoose');
const Chat = require('../models/Chat.model');
const Message = require('../models/Message.model');
const { createAppError } = require('../utils/appError');

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

async function ensureChatParticipant(chatId, userId) {
  const chat = await Chat.findOne({
    _id: chatId,
    'participants.user': userId,
  }).populate('participants.user', 'name email avatarUrl fcmTokens');

  if (!chat) {
    throw createAppError(404, 'Chat not found or access denied.');
  }

  return chat;
}

function buildChatName(chat, userId) {
  if (chat.type === 'group' && chat.name) {
    return chat.name;
  }

  const others = chat.participants.filter(
    (participant) => String(participant.user._id || participant.user) !== String(userId),
  );

  return others.map((participant) => participant.user.name).join(', ') || 'Direct chat';
}

function serializeChat(chat, userId) {
  const membership =
    chat.participants.find((participant) => String(participant.user._id || participant.user) === String(userId)) ||
    null;
  const otherParticipants = chat.participants.filter(
    (participant) => String(participant.user._id || participant.user) !== String(userId),
  );
  const avatarUrl =
    chat.avatarUrl ||
    (chat.type === 'direct' ? otherParticipants[0]?.user?.avatarUrl || '' : otherParticipants[0]?.user?.avatarUrl || '');

  return {
    _id: chat._id,
    type: chat.type,
    name: buildChatName(chat, userId),
    description: chat.description,
    avatarUrl,
    memberCount: chat.participants.length,
    latestMessage: chat.latestMessage,
    participants: chat.participants.map((participant) => ({
      user: participant.user,
      role: participant.role,
      customLists: participant.customLists,
      unreadCount: participant.unreadCount,
      isPinned: participant.isPinned,
      isMuted: participant.isMuted,
      joinedAt: participant.joinedAt,
    })),
    membership: membership
      ? {
          customLists: membership.customLists,
          unreadCount: membership.unreadCount,
          isPinned: membership.isPinned,
          isMuted: membership.isMuted,
          lastReadMessageId: membership.lastReadMessageId,
        }
      : null,
    createdBy: chat.createdBy,
    updatedAt: chat.updatedAt,
    createdAt: chat.createdAt,
  };
}

async function createMessageRecord({ chatId, senderId, payload }) {
  const chat = await ensureChatParticipant(chatId, senderId);
  const senderObjectId = toObjectId(senderId);
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  const message = await Message.create({
    chatId,
    senderId,
    clientMessageId: payload.clientMessageId || '',
    kind: payload.kind || (attachments.length ? 'file' : 'text'),
    text: payload.text || '',
    attachments,
    replyTo: payload.replyTo || null,
    metadata: payload.metadata || {},
    deliveredTo: [senderObjectId],
    seenBy: [senderObjectId],
  });

  await Chat.updateOne(
    { _id: chatId },
    {
      $set: { latestMessage: message._id, updatedAt: new Date() },
      $inc: { 'participants.$[recipient].unreadCount': 1 },
    },
    {
      arrayFilters: [{ 'recipient.user': { $ne: senderObjectId } }],
    },
  );

  await Chat.updateOne(
    { _id: chatId, 'participants.user': senderObjectId },
    {
      $set: {
        'participants.$.lastReadMessageId': message._id,
        'participants.$.unreadCount': 0,
      },
    },
  );

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name email avatarUrl')
    .populate('replyTo');

  return { chat, message: populatedMessage };
}

async function markMessagesDelivered({ chatId, userId, messageIds = [] }) {
  await ensureChatParticipant(chatId, userId);

  const filter = {
    chatId,
    senderId: { $ne: userId },
    deliveredTo: { $ne: toObjectId(userId) },
  };

  if (messageIds.length) {
    filter._id = { $in: messageIds };
  }

  const targetMessages = await Message.find(filter).select('_id');
  if (!targetMessages.length) {
    return [];
  }

  const ids = targetMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: ids } },
    { $addToSet: { deliveredTo: toObjectId(userId) } },
  );

  return ids;
}

async function markMessagesSeen({ chatId, userId, messageIds = [] }) {
  await ensureChatParticipant(chatId, userId);

  const filter = {
    chatId,
    senderId: { $ne: userId },
    seenBy: { $ne: toObjectId(userId) },
  };

  if (messageIds.length) {
    filter._id = { $in: messageIds };
  }

  const targetMessages = await Message.find(filter).sort({ createdAt: 1 }).select('_id');
  if (!targetMessages.length) {
    return [];
  }

  const ids = targetMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: ids } },
    {
      $addToSet: {
        seenBy: toObjectId(userId),
        deliveredTo: toObjectId(userId),
      },
    },
  );

  await Chat.updateOne(
    { _id: chatId, 'participants.user': userId },
    {
      $set: {
        'participants.$.unreadCount': 0,
        'participants.$.lastReadMessageId': ids[ids.length - 1],
      },
    },
  );

  return ids;
}

module.exports = {
  createMessageRecord,
  ensureChatParticipant,
  markMessagesDelivered,
  markMessagesSeen,
  serializeChat,
};
