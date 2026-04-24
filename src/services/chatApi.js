import { API_URL } from '../config/network';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export async function fetchBackendHealth(signal) {
  const response = await fetch(`${API_URL}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  return parseResponse(response);
}

export async function fetchMe(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

export async function login({ email, password }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse(response);
}

export async function register(payload) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateProfile(token, payload) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateProfileAvatar(token, file) {
  const formData = new FormData();
  formData.append('avatar', {
    uri: file.uri,
    name: file.name || 'avatar.jpg',
    type: file.type || 'image/jpeg',
  });

  const response = await fetch(`${API_URL}/auth/me/avatar`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response);
}

export async function fetchChats(token, list) {
  const query = list ? `?list=${encodeURIComponent(list)}` : '';
  const response = await fetch(`${API_URL}/chats${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

export async function fetchMessages(token, chatId, before) {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  const response = await fetch(`${API_URL}/messages/${chatId}${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

export async function markChatSeen(token, chatId, messageIds = []) {
  const response = await fetch(`${API_URL}/messages/${chatId}/seen`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageIds }),
  });

  return parseResponse(response);
}

export async function fetchUsers(token, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await fetch(`${API_URL}/users${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

export async function createDirectChat(token, targetUserId) {
  const response = await fetch(`${API_URL}/chats/direct`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  });

  return parseResponse(response);
}

export async function createGroupChat(token, payload) {
  const response = await fetch(`${API_URL}/chats/group`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
