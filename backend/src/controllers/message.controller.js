const Message = require('../models/Message.model');
const asyncHandler = require('../middleware/async.middleware');
const { isCloudinaryReady } = require('../config/cloudinary');
const { createAppError } = require('../utils/appError');
const {
  createMessageRecord,
  ensureChatParticipant,
  markMessagesDelivered,
  markMessagesSeen,
} = require('../services/message.service');
const { notifyRecipients } = require('../services/notification.service');

const getMessages = asyncHandler(async (request, response) => {
  const { chatId } = request.params;
  const limit = Math.min(Number(request.query.limit) || 30, 100);
  const before = request.query.before;

  await ensureChatParticipant(chatId, request.user._id);

  const filter = { chatId };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'name email avatarUrl')
    .populate('replyTo');

  await markMessagesDelivered({
    chatId,
    userId: request.user._id,
    messageIds: messages.map((message) => message._id),
  });

  response.json({ messages: messages.reverse() });
});

const sendMessage = asyncHandler(async (request, response) => {
  const { chatId } = request.params;
  const { text = '', kind, attachments = [], replyTo, metadata = {}, clientMessageId = '' } = request.body;

  if (!text.trim() && !attachments.length) {
    throw createAppError(400, 'Message text or attachments are required.');
  }

  const { chat, message } = await createMessageRecord({
    chatId,
    senderId: request.user._id,
    payload: { text, kind, attachments, replyTo, metadata, clientMessageId },
  });

  const io = request.app.get('io');
  io.to(`chat:${chatId}`).emit('receive_message', { chatId, message });

  await notifyRecipients({
    chat,
    message,
    sender: request.user,
  });

  response.status(201).json({ message });
});

const markSeen = asyncHandler(async (request, response) => {
  const { chatId } = request.params;
  const { messageIds = [] } = request.body;

  const seenIds = await markMessagesSeen({
    chatId,
    userId: request.user._id,
    messageIds,
  });

  const io = request.app.get('io');
  io.to(`chat:${chatId}`).emit('seen', {
    chatId,
    userId: request.user._id,
    messageIds: seenIds,
  });

  response.json({ messageIds: seenIds });
});

const uploadAttachments = asyncHandler(async (request, response) => {
  if (!isCloudinaryReady) {
    throw createAppError(503, 'Cloudinary is not configured.');
  }

  const files = request.files || [];
  if (!files.length) {
    throw createAppError(400, 'No files uploaded.');
  }

  const attachments = files.map((file) => ({
    url: file.path,
    publicId: file.filename || '',
    mimeType: file.mimetype,
    size: file.size,
    name: file.originalname,
  }));

  response.status(201).json({ attachments });
});

module.exports = {
  getMessages,
  sendMessage,
  markSeen,
  uploadAttachments,
};
