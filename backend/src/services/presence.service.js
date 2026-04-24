const socketsByUser = new Map();
const userBySocket = new Map();

function setUserOnline(userId, socketId) {
  const key = String(userId);
  const socketSet = socketsByUser.get(key) || new Set();
  socketSet.add(socketId);
  socketsByUser.set(key, socketSet);
  userBySocket.set(socketId, key);
}

function setUserOffline(socketId) {
  const userId = userBySocket.get(socketId);

  if (!userId) {
    return null;
  }

  const socketSet = socketsByUser.get(userId);
  if (socketSet) {
    socketSet.delete(socketId);

    if (!socketSet.size) {
      socketsByUser.delete(userId);
    }
  }

  userBySocket.delete(socketId);
  return userId;
}

function isUserOnline(userId) {
  return socketsByUser.has(String(userId));
}

module.exports = {
  setUserOnline,
  setUserOffline,
  isUserOnline,
};
