const { sendPushNotification } = require('../config/firebase');
const { isUserOnline } = require('./presence.service');

async function notifyRecipients({ chat, message, sender }) {
  if (!chat?.participants?.length) {
    return;
  }

  const recipients = chat.participants.filter(
    (participant) => String(participant.user._id || participant.user) !== String(sender._id || sender),
  );

  for (const recipient of recipients) {
    const recipientUser = recipient.user;
    const recipientId = String(recipientUser._id || recipientUser);

    if (isUserOnline(recipientId)) {
      continue;
    }

    const tokens = recipientUser.fcmTokens || [];
    if (!tokens.length) {
      continue;
    }

    await sendPushNotification(tokens, {
      title: sender.name,
      body: message.text || 'Shared an attachment',
      data: {
        chatId: String(chat._id),
        messageId: String(message._id),
        kind: message.kind,
      },
    }).catch(() => null);
  }
}

module.exports = {
  notifyRecipients,
};
