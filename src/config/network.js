import { Platform } from 'react-native';

const defaultHost = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

export const USE_REMOTE_BACKEND = false;
export const REMOTE_BACKEND_URL = 'https://your-public-backend-url.com';
export const BACKEND_HOST = defaultHost;
export const BACKEND_PORT = 5000;

const localBaseUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const baseUrl = USE_REMOTE_BACKEND ? REMOTE_BACKEND_URL : localBaseUrl;

export const API_URL = `${baseUrl}/api`;
export const SOCKET_URL = baseUrl;
