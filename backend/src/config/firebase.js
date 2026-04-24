let firebaseApp = null;

function stringifyData(data = {}) {
  return Object.entries(data).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) {
      return accumulator;
    }

    accumulator[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return accumulator;
  }, {});
}

function hasFirebaseCredentials() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

function initFirebase() {
  if (!hasFirebaseCredentials()) {
    console.warn('Firebase Admin not initialized. FCM credentials are missing.');
    return null;
  }

  try {
    const { cert, getApps, initializeApp } = require('firebase-admin/app');

    if (!getApps().length) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized');
    } else {
      firebaseApp = getApps()[0];
    }

    return firebaseApp;
  } catch (error) {
    firebaseApp = null;
    console.warn('Firebase Admin not initialized:', error.message);
    return null;
  }
}

async function sendPushNotification(tokens, { title, body, data = {} }) {
  if (!firebaseApp || !tokens) {
    return;
  }

  const normalizedTokens = [...new Set([].concat(tokens).filter(Boolean))];
  if (!normalizedTokens.length) {
    return;
  }

  const { getMessaging } = require('firebase-admin/messaging');
  const messaging = getMessaging(firebaseApp);
  const payload = {
    notification: { title, body },
    data: stringifyData(data),
    android: {
      priority: 'high',
      notification: { sound: 'default', channelId: 'cbrpnk-messages' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  if (normalizedTokens.length === 1) {
    await messaging.send({
      token: normalizedTokens[0],
      ...payload,
    });
    return;
  }

  await messaging.sendEachForMulticast({
    tokens: normalizedTokens,
    ...payload,
  });
}

module.exports = {
  initFirebase,
  sendPushNotification,
};
