const User = require('../models/User.model');
const { createAppError } = require('../utils/appError');
const { verifyToken } = require('../utils/jwt');
const {
  createMessageRecord,
  ensureChatParticipant,
  markMessagesDelivered,
  markMessagesSeen,
} = require('../services/message.service');
const { notifyRecipients } = require('../services/notification.service');
const { setUserOffline, setUserOnline } = require('../services/presence.service');

module.exports = function registerChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        throw createAppError(401, 'Socket auth token missing.');
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub).select('-password');

      if (!user) {
        throw createAppError(401, 'Socket user not found.');
      }

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    setUserOnline(socket.user._id, socket.id);
    socket.join(`user:${socket.user._id}`);

    socket.broadcast.emit('presence', {
      userId: socket.user._id,
      status: 'online',
    });

    socket.on('join_chat', async (payload = {}, acknowledge) => {
      try {
        const { chatId } = payload;
        await ensureChatParticipant(chatId, socket.user._id);

        socket.join(`chat:${chatId}`);
        const deliveredIds = await markMessagesDelivered({
          chatId,
          userId: socket.user._id,
        });

        if (deliveredIds.length) {
          io.to(`chat:${chatId}`).emit('message_status', {
            chatId,
            messageIds: deliveredIds,
            userId: socket.user._id,
            status: 'delivered',
          });
        }

        if (acknowledge) {
          acknowledge({ ok: true, chatId, deliveredIds });
        }
      } catch (error) {
        if (acknowledge) {
          acknowledge({ ok: false, message: error.message });
        }
      }
    });

    socket.on('send_message', async (payload = {}, acknowledge) => {
      try {
        const { chatId, ...messagePayload } = payload;
        const { chat, message } = await createMessageRecord({
          chatId,
          senderId: socket.user._id,
          payload: messagePayload,
        });

        io.to(`chat:${chatId}`).emit('receive_message', {
          chatId,
          message,
        });

        await notifyRecipients({
          chat,
          message,
          sender: socket.user,
        });

        if (acknowledge) {
          acknowledge({ ok: true, message });
        }
      } catch (error) {
        if (acknowledge) {
          acknowledge({ ok: false, message: error.message });
        }
      }
    });

    socket.on('typing', async (payload = {}) => {
      const { chatId, isTyping = true } = payload;

      socket.to(`chat:${chatId}`).emit('typing', {
        chatId,
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('seen', async (payload = {}, acknowledge) => {
      try {
        const { chatId, messageIds = [] } = payload;
        const seenIds = await markMessagesSeen({
          chatId,
          userId: socket.user._id,
          messageIds,
        });

        io.to(`chat:${chatId}`).emit('seen', {
          chatId,
          userId: socket.user._id,
          messageIds: seenIds,
        });

        if (acknowledge) {
          acknowledge({ ok: true, messageIds: seenIds });
        }
      } catch (error) {
        if (acknowledge) {
          acknowledge({ ok: false, message: error.message });
        }
      }
    });

    socket.on('disconnect', () => {
      const userId = setUserOffline(socket.id);

      if (userId) {
        socket.broadcast.emit('presence', {
          userId,
          status: 'offline',
        });
      }
    });
  });
};
