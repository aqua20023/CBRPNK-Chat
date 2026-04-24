const Chat = require('../models/Chat.model');
const User = require('../models/User.model');
const asyncHandler = require('../middleware/async.middleware');
const { createAppError } = require('../utils/appError');
const { serializeChat } = require('../services/message.service');

function uniqueIds(values) {
  return [...new Set(values.map((value) => String(value)))];
}

const getChats = asyncHandler(async (request, response) => {
  const { list } = request.query;
  const query = {
    'participants.user': request.user._id,
  };

  if (list === 'friends') {
    query.type = 'direct';
  } else if (list === 'groups') {
    query.type = 'group';
  } else if (list && !['all', 'unread', 'pinned'].includes(list)) {
    query.participants = {
      $elemMatch: {
        user: request.user._id,
        customLists: list,
      },
    };
  }

  const chats = await Chat.find(query)
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    })
    .sort({ updatedAt: -1 });

  const serialized = chats
    .map((chat) => serializeChat(chat, request.user._id))
    .filter((chat) => {
      if (list === 'unread') {
        return chat.membership?.unreadCount > 0;
      }

      if (list === 'pinned') {
        return chat.membership?.isPinned;
      }

      return true;
    });

  response.json({ chats: serialized });
});

const getChatById = asyncHandler(async (request, response) => {
  const chat = await Chat.findOne({
    _id: request.params.chatId,
    'participants.user': request.user._id,
  })
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  if (!chat) {
    throw createAppError(404, 'Chat not found.');
  }

  response.json({ chat: serializeChat(chat, request.user._id) });
});

const createDirectChat = asyncHandler(async (request, response) => {
  const { targetUserId } = request.body;
  if (!targetUserId) {
    throw createAppError(400, 'targetUserId is required.');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw createAppError(404, 'Target user not found.');
  }

  const existingChat = await Chat.findOne({
    type: 'direct',
    'participants.user': { $all: [request.user._id, targetUser._id] },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  })
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  if (existingChat) {
    return response.status(200).json({
      chat: serializeChat(existingChat, request.user._id),
    });
  }

  const chat = await Chat.create({
    type: 'direct',
    createdBy: request.user._id,
    participants: [
      {
        user: request.user._id,
        role: 'owner',
        customLists: ['all', 'friends', 'priority'],
      },
      {
        user: targetUser._id,
        role: 'member',
        customLists: ['all', 'friends'],
      },
    ],
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  response.status(201).json({ chat: serializeChat(populatedChat, request.user._id) });
});

const createGroupChat = asyncHandler(async (request, response) => {
  const { name, memberIds = [], description = '' } = request.body;

  if (!name) {
    throw createAppError(400, 'Group name is required.');
  }

  const participantIds = uniqueIds([request.user._id, ...memberIds]);
  if (participantIds.length < 3) {
    throw createAppError(400, 'A group chat needs at least three participants.');
  }

  const users = await User.find({ _id: { $in: participantIds } }).select('_id');
  if (users.length !== participantIds.length) {
    throw createAppError(400, 'One or more group members are invalid.');
  }

  const chat = await Chat.create({
    type: 'group',
    name,
    description,
    createdBy: request.user._id,
    participants: participantIds.map((userId) => ({
      user: userId,
      role: String(userId) === String(request.user._id) ? 'owner' : 'member',
      customLists: ['all', 'groups'],
    })),
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  response.status(201).json({ chat: serializeChat(populatedChat, request.user._id) });
});

const updateCustomLists = asyncHandler(async (request, response) => {
  const { customLists = [] } = request.body;

  await Chat.updateOne(
    { _id: request.params.chatId, 'participants.user': request.user._id },
    { $set: { 'participants.$.customLists': customLists } },
  );

  const chat = await Chat.findOne({
    _id: request.params.chatId,
    'participants.user': request.user._id,
  })
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  if (!chat) {
    throw createAppError(404, 'Chat not found.');
  }

  response.json({ chat: serializeChat(chat, request.user._id) });
});

const togglePinned = asyncHandler(async (request, response) => {
  const chat = await Chat.findOne({
    _id: request.params.chatId,
    'participants.user': request.user._id,
  });

  if (!chat) {
    throw createAppError(404, 'Chat not found.');
  }

  const participant = chat.participants.find(
    (entry) => String(entry.user) === String(request.user._id),
  );

  participant.isPinned = !participant.isPinned;
  await chat.save();

  const populatedChat = await Chat.findById(chat._id)
    .populate('participants.user', 'name email avatarUrl customLists')
    .populate({
      path: 'latestMessage',
      populate: { path: 'senderId', select: 'name email avatarUrl' },
    });

  response.json({ chat: serializeChat(populatedChat, request.user._id) });
});

module.exports = {
  getChats,
  getChatById,
  createDirectChat,
  createGroupChat,
  updateCustomLists,
  togglePinned,
};
