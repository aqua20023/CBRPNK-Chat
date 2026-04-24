import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/network';

export function createChatSocket(token) {
  return io(SOCKET_URL, {
    autoConnect: true,
    auth: { token },
    transports: ['websocket'],
  });
}
