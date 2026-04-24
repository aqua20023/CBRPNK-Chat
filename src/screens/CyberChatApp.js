import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { callMoments, chatLists, stackBlueprint } from '../data/mockData';
import { createTheme, radii, spacing } from '../theme/theme';
import { CyberCard } from '../components/CyberCard';
import { ConversationListItem } from '../components/ConversationListItem';
import { FolderStrip } from '../components/FolderStrip';
import { MessageBubble } from '../components/MessageBubble';
import { ComposerDock } from '../components/ComposerDock';
import { CallOverlay } from '../components/CallOverlay';
import { CreateChatOverlay } from '../components/CreateChatOverlay';
import {
  createDirectChat,
  createGroupChat,
  fetchBackendHealth,
  fetchChats,
  fetchMe,
  fetchMessages,
  fetchUsers,
  login,
  markChatSeen,
  register,
} from '../services/chatApi';
import { createChatSocket } from '../services/socketClient';

const toneKeys = ['mustard', 'olive', 'fog', 'salmon'];

function formatClock(value) {
  if (!value) {
    return 'NOW';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'NOW';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toneFromId(value) {
  const source = String(value || '');
  let total = 0;

  for (let index = 0; index < source.length; index += 1) {
    total += source.charCodeAt(index);
  }

  return toneKeys[total % toneKeys.length];
}

function describeLatestMessage(message) {
  if (!message) {
    return 'No messages yet.';
  }

  if (message.text) {
    return message.text;
  }

  if (message.attachments?.length) {
    return `Shared ${message.attachments[0].name || 'an attachment'}`;
  }

  if (message.kind === 'voice') {
    return 'Voice note';
  }

  return `${message.kind || 'message'} update`;
}

function getPresenceState(chat, currentUserId, presenceMap) {
  const participants = chat.participants || [];
  const others = participants.filter(
    (participant) => String(participant.user?._id || participant.user) !== String(currentUserId),
  );

  return others.some(
    (participant) => presenceMap[String(participant.user?._id || participant.user)] === 'online',
  );
}

function mapServerChat(chat, currentUserId, presenceMap) {
  const id = String(chat._id);
  const participants = chat.participants || [];
  const others = participants.filter(
    (participant) => String(participant.user?._id || participant.user) !== String(currentUserId),
  );

  return {
    ...chat,
    id,
    code: id.slice(-6).toUpperCase(),
    title: chat.name || 'Untitled chat',
    avatarUrl: chat.avatarUrl || others[0]?.user?.avatarUrl || 'https://via.placeholder.com/300/202020/F3E7D6?text=CB',
    preview: describeLatestMessage(chat.latestMessage),
    timestamp: formatClock(chat.latestMessage?.createdAt || chat.updatedAt),
    unread: chat.membership?.unreadCount || 0,
    online: getPresenceState(chat, currentUserId, presenceMap),
    pinned: Boolean(chat.membership?.isPinned),
    tone: toneFromId(id),
    type: chat.type === 'direct' ? '1:1' : 'Group',
    conversationType: chat.type,
    memberCount: chat.memberCount || participants.length,
    lists: chat.membership?.customLists || ['all'],
  };
}

function deriveStatus(message, currentUserId) {
  const deliveredCount = message.deliveredTo?.length || 0;
  const seenCount = message.seenBy?.length || 0;

  if (!message.senderId || String(message.senderId._id || message.senderId) !== String(currentUserId)) {
    return 'seen';
  }

  if (seenCount > 1) {
    return 'seen';
  }

  if (deliveredCount > 1) {
    return 'delivered';
  }

  return 'sent';
}

function normalizeKind(message) {
  if (message.kind === 'text' || message.kind === 'poll' || message.kind === 'voice') {
    return message.kind;
  }

  if (message.kind === 'location') {
    return 'location';
  }

  if (message.kind === 'link') {
    return 'link';
  }

  if (message.attachments?.length) {
    return 'file';
  }

  return 'text';
}

function mapServerMessage(message, currentUserId) {
  const sender = message.senderId || {};
  const attachment = message.attachments?.[0];
  const sizeLabel = attachment?.size ? `${Math.round(attachment.size / 1024)} KB` : '';

  return {
    id: String(message._id),
    kind: normalizeKind(message),
    author: sender.name || 'Unknown',
    fromMe: String(sender._id || sender) === String(currentUserId),
    text: message.text || '',
    time: formatClock(message.createdAt),
    status: deriveStatus(message, currentUserId),
    reactions: message.reactions || [],
    pinned: false,
    replyTo: message.replyTo?._id ? String(message.replyTo._id) : message.replyTo || null,
    replyPreview:
      message.replyTo?.text ||
      message.replyTo?.title ||
      message.replyTo?.location ||
      message.replyTo?.urlTitle ||
      null,
    title: attachment?.name || '',
    fileType: attachment?.mimeType?.split('/')?.[1]?.toUpperCase() || 'FILE',
    size: sizeLabel,
    duration: message.metadata?.duration || '0:00',
    waveform: message.metadata?.waveform || [0.5, 0.7, 0.4, 0.8, 0.6, 0.5],
    options: message.metadata?.options || [],
    location: message.metadata?.location || '',
    coordinates: message.metadata?.coordinates || '',
    urlTitle: message.metadata?.urlTitle || '',
    urlDomain: message.metadata?.urlDomain || '',
    urlExcerpt: message.metadata?.urlExcerpt || '',
  };
}

function getListMatch(chat, selectedList) {
  if (selectedList === 'all') {
    return true;
  }

  if (selectedList === 'friends') {
    return chat.conversationType === 'direct';
  }

  if (selectedList === 'groups') {
    return chat.conversationType === 'group';
  }

  if (selectedList === 'unread') {
    return chat.unread > 0;
  }

  if (selectedList === 'pinned') {
    return chat.pinned;
  }

  return chat.lists.includes(selectedList);
}

function buildReplySnippet(messages, replyToId, replyPreview) {
  if (replyPreview) {
    return replyPreview;
  }

  if (!replyToId) {
    return null;
  }

  const source = messages.find((item) => item.id === replyToId);
  if (!source) {
    return null;
  }

  if (source.deleted) {
    return 'Deleted message';
  }

  return source.text || source.title || source.location || source.urlTitle || 'Attachment';
}

function upsertMessage(currentMessages, nextMessage) {
  const messageId = String(nextMessage._id);
  const clientMessageId = nextMessage.clientMessageId;
  const index = currentMessages.findIndex((message) => {
    if (String(message._id) === messageId) {
      return true;
    }

    return clientMessageId && message.clientMessageId && message.clientMessageId === clientMessageId;
  });

  if (index === -1) {
    return [...currentMessages, nextMessage].sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
    );
  }

  const nextMessages = [...currentMessages];
  nextMessages[index] = nextMessage;
  return nextMessages.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
}

function sortChats(chats) {
  return [...chats].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

function buildOptimisticMessage({ chatId, currentUser, text, clientMessageId, replyTo }) {
  return {
    _id: `temp-${clientMessageId}`,
    chatId,
    senderId: {
      _id: currentUser._id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    },
    text,
    kind: 'text',
    clientMessageId,
    replyTo: replyTo
      ? {
          _id: replyTo.id,
          text: replyTo.text,
          title: replyTo.title,
          location: replyTo.location,
          urlTitle: replyTo.urlTitle,
        }
      : null,
    attachments: [],
    metadata: {},
    deliveredTo: [currentUser._id],
    seenBy: [currentUser._id],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function applyProfileUpdateToChats(chats, payload) {
  return chats.map((chat) => {
    const participants = (chat.participants || []).map((participant) => {
      if (String(participant.user?._id || participant.user) !== String(payload.userId)) {
        return participant;
      }

      return {
        ...participant,
        user: {
          ...participant.user,
          ...payload.profile,
        },
      };
    });

    const shouldUpdateAvatar =
      chat.type === 'direct' &&
      participants.some(
        (participant) => String(participant.user?._id || participant.user) === String(payload.userId),
      );

    return {
      ...chat,
      participants,
      name:
        chat.type === 'direct' && shouldUpdateAvatar
          ? participants
              .filter(
                (participant) => String(participant.user?._id || participant.user) !== String(payload.currentUserId),
              )
              .map((participant) => participant.user.name)
              .join(', ') || chat.name
          : chat.name,
      avatarUrl: shouldUpdateAvatar ? payload.profile.avatarUrl || chat.avatarUrl : chat.avatarUrl,
    };
  });
}

export function CyberChatApp() {
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const [themeMode, setThemeMode] = useState('dark');
  const [activeTab, setActiveTab] = useState('Chats');
  const [selectedList, setSelectedList] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('list');
  const [composerValue, setComposerValue] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [callVisible, setCallVisible] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    state: 'probing',
    label: 'API LINK PENDING',
    detail: 'Waiting for MongoDB and Socket.io backend.',
  });
  const [socketStatus, setSocketStatus] = useState('offline');
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [credentials, setCredentials] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [authState, setAuthState] = useState({
    token: '',
    user: null,
  });
  const [rawChats, setRawChats] = useState([]);
  const [messagesState, setMessagesState] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [screenError, setScreenError] = useState('');
  const [createChatVisible, setCreateChatVisible] = useState(false);
  const [createChatMode, setCreateChatMode] = useState('direct');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [groupDraft, setGroupDraft] = useState({
    name: '',
    description: '',
  });
  const panelAnimation = useRef(new Animated.Value(0)).current;

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedChatIdRef = useRef(selectedChatId);
  const authUserRef = useRef(authState.user);

  const theme = createTheme(themeMode);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    authUserRef.current = authState.user;
  }, [authState.user]);

  useEffect(() => {
    if (isWide) {
      setMobilePanel('chat');
    }
  }, [isWide]);

  useEffect(() => {
    Animated.timing(panelAnimation, {
      toValue: selectedChatId ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [panelAnimation, selectedChatId]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    fetchBackendHealth(controller.signal)
      .then((payload) => {
        if (!active) {
          return;
        }

        setBackendStatus({
          state: 'online',
          label: 'BACKEND ONLINE',
          detail: payload.message || 'API healthy and ready for auth, chats, and sockets.',
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setBackendStatus({
          state: 'offline',
          label: 'BACKEND OFFLINE',
          detail: 'Start /backend before testing auth, socket rooms, and live delivery.',
        });
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!authState.token) {
      setRawChats([]);
      setMessagesState({});
      setSelectedChatId(null);
      return;
    }

    let active = true;
    setScreenError('');

    Promise.all([fetchMe(authState.token), fetchChats(authState.token, selectedList)])
      .then(([mePayload, chatsPayload]) => {
        if (!active) {
          return;
        }

        setAuthState((current) => ({
          ...current,
          user: mePayload.user,
        }));
        setRawChats(sortChats(chatsPayload.chats || []));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setScreenError(error.message || 'Failed to load chats.');
      });

    return () => {
      active = false;
    };
  }, [authState.token, selectedList]);

  useEffect(() => {
    if (!authState.token || !createChatVisible) {
      return;
    }

    let active = true;
    setUsersLoading(true);

    fetchUsers(authState.token, userQuery)
      .then((payload) => {
        if (active) {
          setUserResults(payload.users || []);
        }
      })
      .catch((error) => {
        if (active) {
          setScreenError(error.message || 'Failed to load users.');
        }
      })
      .finally(() => {
        if (active) {
          setUsersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authState.token, createChatVisible, userQuery]);

  useEffect(() => {
    if (!rawChats.length) {
      setSelectedChatId(null);
      return;
    }

    const exists = rawChats.some((chat) => String(chat._id) === String(selectedChatId));
    if (!exists) {
      setSelectedChatId(String(rawChats[0]._id));
    }
  }, [rawChats, selectedChatId]);

  useEffect(() => {
    if (!authState.token || !selectedChatId) {
      return;
    }

    let active = true;
    setMessagesLoading(true);

    fetchMessages(authState.token, selectedChatId)
      .then((payload) => {
        if (!active) {
          return;
        }

        setMessagesState((current) => ({
          ...current,
          [selectedChatId]: payload.messages || [],
        }));

        const unseenIds = (payload.messages || [])
          .filter(
            (message) =>
              String(message.senderId?._id || message.senderId) !== String(authState.user?._id) &&
              !(message.seenBy || []).some((entry) => String(entry) === String(authState.user?._id)),
          )
          .map((message) => String(message._id));

        if (unseenIds.length) {
          markChatSeen(authState.token, selectedChatId, unseenIds).catch(() => null);
          socketRef.current?.emit('seen', { chatId: selectedChatId, messageIds: unseenIds });
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setScreenError(error.message || 'Failed to load messages.');
      })
      .finally(() => {
        if (active) {
          setMessagesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authState.token, authState.user?._id, selectedChatId]);

  useEffect(() => {
    if (!authState.token || !authState.user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketStatus('offline');
      return undefined;
    }

    const socket = createChatSocket(authState.token);
    socketRef.current = socket;
    setSocketStatus('connecting');

    const typingTimers = new Map();

    socket.on('connect', () => {
      setSocketStatus('online');
    });

    socket.on('disconnect', () => {
      setSocketStatus('offline');
    });

    socket.on('presence', ({ userId, status }) => {
      setPresenceMap((current) => ({
        ...current,
        [String(userId)]: status,
      }));
    });

    socket.on('typing', ({ chatId, userId, name, isTyping }) => {
      const key = String(chatId);

      if (!isTyping) {
        setTypingMap((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        return;
      }

      setTypingMap((current) => ({
        ...current,
        [key]: { userId: String(userId), name },
      }));

      clearTimeout(typingTimers.get(key));
      const timeoutId = setTimeout(() => {
        setTypingMap((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
      }, 1400);

      typingTimers.set(key, timeoutId);
    });

    socket.on('receive_message', ({ chatId, message }) => {
      const key = String(chatId);

      setMessagesState((current) => ({
        ...current,
        [key]: upsertMessage(current[key] || [], message),
      }));

      setRawChats((current) =>
        sortChats(
          current.map((chat) => {
            if (String(chat._id) !== key) {
              return chat;
            }

            const isMine =
              String(message.senderId?._id || message.senderId) === String(authUserRef.current?._id);

            return {
              ...chat,
              latestMessage: message,
              updatedAt: message.createdAt || new Date().toISOString(),
              membership: {
                ...chat.membership,
                unreadCount:
                  !isMine && selectedChatIdRef.current !== key
                    ? (chat.membership?.unreadCount || 0) + 1
                    : selectedChatIdRef.current === key
                      ? 0
                      : chat.membership?.unreadCount || 0,
              },
            };
          }),
        ),
      );

      const isCurrentChat = selectedChatIdRef.current === key;
      const isFromMe =
        String(message.senderId?._id || message.senderId) === String(authUserRef.current?._id);

      if (isCurrentChat && !isFromMe) {
        socket.emit('seen', { chatId: key, messageIds: [String(message._id)] });
      }
    });

    socket.on('message_status', ({ chatId, messageIds, userId, status }) => {
      const key = String(chatId);
      const targetIds = new Set((messageIds || []).map(String));

      setMessagesState((current) => ({
        ...current,
        [key]: (current[key] || []).map((message) => {
          if (!targetIds.has(String(message._id))) {
            return message;
          }

          const deliveredTo = new Set((message.deliveredTo || []).map(String));
          const seenBy = new Set((message.seenBy || []).map(String));

          if (status === 'delivered') {
            deliveredTo.add(String(userId));
          }

          if (status === 'seen') {
            seenBy.add(String(userId));
            deliveredTo.add(String(userId));
          }

          return {
            ...message,
            deliveredTo: [...deliveredTo],
            seenBy: [...seenBy],
          };
        }),
      }));
    });

    socket.on('seen', ({ chatId, messageIds, userId }) => {
      const key = String(chatId);
      const targetIds = new Set((messageIds || []).map(String));

      setMessagesState((current) => ({
        ...current,
        [key]: (current[key] || []).map((message) => {
          if (!targetIds.has(String(message._id))) {
            return message;
          }

          const deliveredTo = new Set((message.deliveredTo || []).map(String));
          const seenBy = new Set((message.seenBy || []).map(String));
          deliveredTo.add(String(userId));
          seenBy.add(String(userId));

          return {
            ...message,
            deliveredTo: [...deliveredTo],
            seenBy: [...seenBy],
          };
        }),
      }));

      if (selectedChatIdRef.current === key) {
        setRawChats((current) =>
          current.map((chat) =>
            String(chat._id) === key
              ? {
                  ...chat,
                  membership: {
                    ...chat.membership,
                    unreadCount: 0,
                  },
                }
              : chat,
          ),
        );
      }
    });

    socket.on('profile_updated', ({ userId, profile }) => {
      setRawChats((current) =>
        applyProfileUpdateToChats(current, {
          userId,
          profile,
          currentUserId: authUserRef.current?._id,
        }),
      );

      if (String(userId) === String(authUserRef.current?._id)) {
        setAuthState((current) => ({
          ...current,
          user: current.user ? { ...current.user, ...profile } : current.user,
        }));
      }
    });

    return () => {
      typingTimers.forEach((value) => clearTimeout(value));
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [authState.token, authState.user]);

  useEffect(() => {
    if (!socketRef.current || !rawChats.length) {
      return;
    }

    rawChats.forEach((chat) => {
      socketRef.current.emit('join_chat', { chatId: String(chat._id) });
    });
  }, [rawChats]);

  const liveChats = rawChats
    .map((chat) => mapServerChat(chat, authState.user?._id, presenceMap))
    .filter((chat) => {
      const listMatch = getListMatch(chat, selectedList);
      const query = search.trim().toLowerCase();
      const queryMatch =
        !query ||
        chat.title.toLowerCase().includes(query) ||
        chat.preview.toLowerCase().includes(query) ||
        chat.code.toLowerCase().includes(query);

      return listMatch && queryMatch;
    });

  const selectedRawChat =
    rawChats.find((chat) => String(chat._id) === String(selectedChatId)) || rawChats[0] || null;
  const selectedChat = selectedRawChat
    ? mapServerChat(selectedRawChat, authState.user?._id, presenceMap)
    : null;
  const rawMessages = messagesState[selectedChat?.id] || [];
  const liveMessages = rawMessages.map((message) => mapServerMessage(message, authState.user?._id));

  const chatSummary = {
    direct: rawChats.filter((chat) => chat.type === 'direct').length,
    group: rawChats.filter((chat) => chat.type === 'group').length,
    unread: rawChats.reduce((count, chat) => count + (chat.membership?.unreadCount || 0), 0),
  };

  async function handleAuthSubmit() {
    setAuthBusy(true);
    setAuthError('');

    try {
      const payload =
        authMode === 'login'
          ? await login({
              email: credentials.email.trim(),
              password: credentials.password,
            })
          : await register({
              name: credentials.name.trim(),
              email: credentials.email.trim(),
              password: credentials.password,
            });

      setAuthState({
        token: payload.token,
        user: payload.user,
      });
      setCredentials({
        name: '',
        email: credentials.email,
        password: '',
      });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setAuthState({ token: '', user: null });
    setPresenceMap({});
    setTypingMap({});
    setSelectedMessageId(null);
    setReplyTarget(null);
    setComposerValue('');
  }

  function openCreateChat() {
    setCreateChatVisible(true);
    setCreateChatMode('direct');
    setSelectedUserIds([]);
    setUserQuery('');
    setGroupDraft({ name: '', description: '' });
  }

  function closeCreateChat() {
    setCreateChatVisible(false);
    setSelectedUserIds([]);
    setUserQuery('');
    setGroupDraft({ name: '', description: '' });
  }

  function handleSelectChat(chatId) {
    setSelectedChatId(chatId);
    setSelectedMessageId(null);
    setReplyTarget(null);
    socketRef.current?.emit('join_chat', { chatId });
    if (!isWide) {
      setMobilePanel('chat');
    }
  }

  function toggleUserSelection(userId) {
    setSelectedUserIds((current) => {
      if (createChatMode === 'direct') {
        return current[0] === userId ? [] : [userId];
      }

      return current.includes(userId)
        ? current.filter((entry) => entry !== userId)
        : [...current, userId];
    });
  }

  async function handleCreateChatSubmit() {
    if (!authState.token) {
      return;
    }

    try {
      let payload;

      if (createChatMode === 'direct') {
        if (!selectedUserIds.length) {
          setScreenError('Select one user for a direct chat.');
          return;
        }

        payload = await createDirectChat(authState.token, selectedUserIds[0]);
      } else {
        if (selectedUserIds.length < 2) {
          setScreenError('Select at least two users for a group chat.');
          return;
        }

        if (!groupDraft.name.trim()) {
          setScreenError('Enter a group name first.');
          return;
        }

        payload = await createGroupChat(authState.token, {
          name: groupDraft.name.trim(),
          description: groupDraft.description.trim(),
          memberIds: selectedUserIds,
        });
      }

      const nextChat = payload.chat;
      setRawChats((current) => sortChats([nextChat, ...current.filter((chat) => String(chat._id) !== String(nextChat._id))]));
      handleSelectChat(String(nextChat._id));
      socketRef.current?.emit('join_chat', { chatId: String(nextChat._id) });
      closeCreateChat();
      setScreenError('');
    } catch (error) {
      setScreenError(error.message || 'Failed to create chat.');
    }
  }

  function handleComposerChange(value) {
    setComposerValue(value);

    if (!socketRef.current || !selectedChatId || !authState.user) {
      return;
    }

    socketRef.current.emit('typing', {
      chatId: selectedChatId,
      isTyping: value.trim().length > 0,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', {
        chatId: selectedChatId,
        isTyping: false,
      });
    }, 1200);
  }

  function handleSend() {
    if (!composerValue.trim() || !selectedChatId || !socketRef.current || !authState.user) {
      return;
    }

    const clientMessageId = `${authState.user._id}-${Date.now()}`;
    const optimisticMessage = buildOptimisticMessage({
      chatId: selectedChatId,
      currentUser: authState.user,
      text: composerValue.trim(),
      clientMessageId,
      replyTo: replyTarget,
    });

    setMessagesState((current) => ({
      ...current,
      [selectedChatId]: upsertMessage(current[selectedChatId] || [], optimisticMessage),
    }));

    setRawChats((current) =>
      sortChats(
        current.map((chat) =>
          String(chat._id) === String(selectedChatId)
            ? {
                ...chat,
                latestMessage: optimisticMessage,
                updatedAt: optimisticMessage.createdAt,
              }
            : chat,
        ),
      ),
    );

    const outgoingText = composerValue.trim();
    setComposerValue('');
    setReplyTarget(null);

    socketRef.current.emit(
      'send_message',
      {
        chatId: selectedChatId,
        text: outgoingText,
        clientMessageId,
        replyTo: replyTarget?.id || null,
      },
      (acknowledgement) => {
        if (!acknowledgement?.ok) {
          setScreenError(acknowledgement?.message || 'Failed to send message.');
        }
      },
    );
  }

  function handleQuickAction(action) {
    if (action === 'Call') {
      setCallVisible(true);
      return;
    }

    const presets = {
      Voice: 'Voice note upload will be wired to media next.',
      Poll: 'Poll card support is ready for the next API pass.',
      GIF: 'GIF share queued from the composer lane.',
      Locate: 'Location share trigger is staged for the next build.',
      Doc: 'Document upload will use the backend attachment route.',
    };

    handleComposerChange(presets[action] || composerValue);
  }

  function handleMessageAction(action) {
    if (!selectedMessageId || !selectedChatId) {
      return;
    }

    const target = liveMessages.find((message) => message.id === selectedMessageId);
    if (!target) {
      return;
    }

    if (action === 'Reply') {
      setReplyTarget(target);
      return;
    }

    if (action === 'Forward') {
      setComposerValue(`Forwarded: ${target.text || target.title || target.location || 'Attachment'}`);
      return;
    }

    if (action === 'React') {
      setMessagesState((current) => ({
        ...current,
        [selectedChatId]: (current[selectedChatId] || []).map((message) =>
          String(message._id) === selectedMessageId
            ? {
                ...message,
                reactions: (message.reactions || []).includes('FIRE')
                  ? (message.reactions || []).filter((item) => item !== 'FIRE')
                  : [...(message.reactions || []), 'FIRE'],
              }
            : message,
        ),
      }));
      return;
    }

    if (action === 'Delete' || action === 'Edit' || action === 'Pin') {
      setScreenError(`${action} is still UI-only until the next backend pass.`);
    }
  }

  function toggleChatPin() {
    setScreenError('Chat pin persistence is already supported in the backend but not yet wired in the app surface.');
  }

  function renderAuthGate() {
    return (
      <View style={styles.authWrap}>
        <CyberCard tone="mustard" theme={theme} style={styles.authCard}>
          <Text style={[styles.heroCode, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
            ACCESS
          </Text>
          <Text style={[styles.heroTitle, { color: theme.colors.ink }]}>
            Connect the React Native app to live auth and realtime rooms.
          </Text>
          <Text style={[styles.heroBody, { color: theme.colors.ink }]}>
            Register a user or log in with an existing account from your MongoDB backend. Once authenticated, chats and messages switch from seeded UI to live API and Socket.io data.
          </Text>

          <View style={styles.authModeRow}>
            {['login', 'register'].map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setAuthMode(mode)}
                style={[
                  styles.authModeButton,
                  {
                    backgroundColor: authMode === mode ? theme.colors.ink : 'transparent',
                    borderColor: theme.colors.ink,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.authModeText,
                    {
                      color: authMode === mode ? theme.colors.neon : theme.colors.ink,
                    },
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {authMode === 'register' ? (
            <TextInput
              placeholder="Display name"
              placeholderTextColor="rgba(19, 16, 13, 0.6)"
              value={credentials.name}
              onChangeText={(value) => setCredentials((current) => ({ ...current, name: value }))}
              style={[styles.authInput, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
            />
          ) : null}

          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            placeholderTextColor="rgba(19, 16, 13, 0.6)"
            value={credentials.email}
            onChangeText={(value) => setCredentials((current) => ({ ...current, email: value }))}
            style={[styles.authInput, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="rgba(19, 16, 13, 0.6)"
            value={credentials.password}
            onChangeText={(value) => setCredentials((current) => ({ ...current, password: value }))}
            style={[styles.authInput, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
          />

          {authError ? (
            <Text style={[styles.authError, { color: theme.colors.ink }]}>{authError}</Text>
          ) : null}

          <Pressable
            onPress={handleAuthSubmit}
            style={[styles.authSubmit, { backgroundColor: theme.colors.ink }]}
          >
            <Text style={[styles.authSubmitText, { color: theme.colors.neon }]}>
              {authBusy ? 'WORKING...' : authMode === 'login' ? 'ENTER CHATS' : 'CREATE ACCOUNT'}
            </Text>
          </Pressable>
        </CyberCard>
      </View>
    );
  }

  function renderChats() {
    if (!authState.token) {
      return renderAuthGate();
    }

    return (
      <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
        {(isWide || mobilePanel === 'list') ? (
          <View style={[styles.sidebar, isWide && styles.sidebarWide]}>
            <CyberCard tone="mustard" theme={theme} style={styles.heroCard}>
              <Text style={[styles.heroCode, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                CHATS
              </Text>
              <Text style={[styles.heroTitle, { color: theme.colors.ink }]}>
                Live personal and group conversations filtered through custom lists.
              </Text>
              <Text style={[styles.heroBody, { color: theme.colors.ink }]}>
                JWT auth, MongoDB chat history, live rooms, typing indicators, delivery receipts, seen state, and profile-photo broadcasts are now all part of the same mobile surface.
              </Text>

              <View style={styles.heroStats}>
                <View style={[styles.heroStat, { borderColor: theme.colors.ink }]}>
                  <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>FRIENDS</Text>
                  <Text style={[styles.heroStatValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                    {chatSummary.direct}
                  </Text>
                </View>
                <View style={[styles.heroStat, { borderColor: theme.colors.ink }]}>
                  <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>GROUPS</Text>
                  <Text style={[styles.heroStatValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                    {chatSummary.group}
                  </Text>
                </View>
                <View style={[styles.heroStat, { borderColor: theme.colors.ink }]}>
                  <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>UNREAD</Text>
                  <Text style={[styles.heroStatValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                    {chatSummary.unread}
                  </Text>
                </View>
              </View>

              <View style={[styles.backendCard, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>
                  {backendStatus.label} / SOCKET {socketStatus.toUpperCase()}
                </Text>
                <Text style={[styles.backendDetail, { color: theme.colors.ink }]}>
                  {backendStatus.detail}
                </Text>
                <Text style={[styles.backendDetail, { color: theme.colors.ink }]}>
                  {authState.user?.email}
                </Text>
              </View>
            </CyberCard>

            <View style={styles.sectionSpacing}>
              <View style={styles.sectionTopRow}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>CUSTOM LISTS</Text>
                <View style={styles.sectionActions}>
                  <Pressable onPress={openCreateChat}>
                    <Text style={[styles.sectionAction, { color: theme.colors.neon }]}>NEW CHAT</Text>
                  </Pressable>
                  <Pressable onPress={handleLogout}>
                    <Text style={[styles.sectionAction, { color: theme.colors.neon }]}>LOG OUT</Text>
                  </Pressable>
                </View>
              </View>
              <FolderStrip
                folders={chatLists}
                selected={selectedList}
                onSelect={setSelectedList}
                theme={theme}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conversationList}>
              {liveChats.map((chat) => (
                <ConversationListItem
                  key={chat.id}
                  chat={chat}
                  active={chat.id === selectedChat?.id}
                  theme={theme}
                  onPress={() => handleSelectChat(chat.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {(isWide || mobilePanel === 'chat') && selectedChat ? (
          <Animated.View
            style={{
              flex: 1,
              opacity: panelAnimation,
              transform: [
                {
                  translateX: panelAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            {renderChatPanel()}
          </Animated.View>
        ) : null}
      </View>
    );
  }

  function renderMessageActionRow() {
    if (!selectedMessageId) {
      return null;
    }

    const actions = ['Reply', 'React', 'Forward', 'Pin', 'Edit', 'Delete'];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionRow}
      >
        {actions.map((action, index) => {
          const panel = theme.panels[toneKeys[index % toneKeys.length]];

          return (
            <Pressable
              key={action}
              onPress={() => handleMessageAction(action)}
              style={[styles.actionPill, { backgroundColor: panel.base, borderColor: panel.border }]}
            >
              <Text style={[styles.actionText, { color: panel.text, fontFamily: theme.fonts.display }]}>
                {action}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  function renderChatPanel() {
    const typingEntry = typingMap[selectedChat?.id];

    return (
      <View style={styles.chatPane}>
        <CyberCard tone={selectedChat?.tone || 'fog'} theme={theme} style={styles.chatHeader}>
          <View style={styles.chatHeaderTop}>
            {!isWide ? (
              <Pressable onPress={() => setMobilePanel('list')}>
                <Text style={[styles.headerMini, { color: theme.colors.ink }]}>BACK</Text>
              </Pressable>
            ) : (
              <Text style={[styles.headerMini, { color: theme.colors.ink }]}>CHANNEL</Text>
            )}
            <View style={styles.headerRight}>
              <Text style={[styles.headerMini, { color: theme.colors.ink }]}>
                {typingEntry ? 'TYPING...' : selectedChat?.online ? 'ONLINE' : 'OFFLINE'}
              </Text>
              <Pressable onPress={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}>
                <Text style={[styles.headerMini, { color: theme.colors.ink }]}>
                  {themeMode === 'dark' ? 'LIGHT' : 'DARK'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.chatIdentityRow}>
            <Image
              source={{ uri: selectedChat?.avatarUrl }}
              style={[styles.chatAvatar, { borderColor: theme.colors.ink }]}
            />
            <View style={styles.chatIdentityText}>
              <Text style={[styles.chatTitle, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                {selectedChat?.title}
              </Text>
              <Text style={[styles.chatSubtitle, { color: theme.colors.ink }]}>
                {selectedChat?.conversationType === 'direct'
                  ? 'Live friend thread over Socket.io'
                  : `${selectedChat?.memberCount || 0} members in this live room`}
              </Text>
            </View>
          </View>

          <View style={styles.chatHeaderMeta}>
            <Text style={[styles.chatCode, { color: theme.colors.ink }]}>{selectedChat?.code}</Text>
            <Text style={[styles.chatCode, { color: theme.colors.ink }]}>
              {selectedChat?.conversationType === 'direct' ? 'FRIEND CHAT' : 'GROUP CHAT'}
            </Text>
            <Pressable onPress={toggleChatPin}>
              <Text style={[styles.chatCode, { color: theme.colors.ink }]}>
                {selectedChat?.pinned ? 'UNPIN CHAT' : 'PIN CHAT'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setCallVisible(true)}>
              <Text style={[styles.chatCode, { color: theme.colors.ink }]}>CALL</Text>
            </Pressable>
          </View>
        </CyberCard>

        {renderMessageActionRow()}

        <ScrollView
          style={styles.messageScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageContent}
        >
          {typingEntry ? (
            <Text style={[styles.typingIndicator, { color: theme.colors.textMuted }]}>
              {typingEntry.name} is typing...
            </Text>
          ) : null}

          {messagesLoading ? (
            <Text style={[styles.typingIndicator, { color: theme.colors.textMuted }]}>Loading room...</Text>
          ) : null}

          {liveMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              theme={theme}
              selected={message.id === selectedMessageId}
              replyPreview={buildReplySnippet(liveMessages, message.replyTo, message.replyPreview)}
              onPress={() => setSelectedMessageId((current) => (current === message.id ? null : message.id))}
            />
          ))}
        </ScrollView>

        <ComposerDock
          theme={theme}
          value={composerValue}
          onChange={handleComposerChange}
          onSend={handleSend}
          onQuickAction={handleQuickAction}
          replyTarget={replyTarget}
          onClearReply={() => setReplyTarget(null)}
        />
      </View>
    );
  }

  function renderCalls() {
    return (
      <ScrollView contentContainerStyle={styles.callsWrap} showsVerticalScrollIndicator={false}>
        {callMoments.map((call) => (
          <CyberCard key={call.id} tone={call.tone} theme={theme} style={styles.callCard}>
            <Text style={[styles.callTime, { color: theme.colors.ink }]}>{call.time}</Text>
            <Text style={[styles.callTitle, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
              {call.title}
            </Text>
            <Text style={[styles.callSubtitle, { color: theme.colors.ink }]}>{call.subtitle}</Text>
            <View style={styles.callActions}>
              <Pressable style={[styles.callAction, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.callActionText, { color: theme.colors.ink }]}>VOICE</Text>
              </Pressable>
              <Pressable style={[styles.callAction, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.callActionText, { color: theme.colors.ink }]}>VIDEO</Text>
              </Pressable>
              <Pressable style={[styles.callAction, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.callActionText, { color: theme.colors.ink }]}>SHARE</Text>
              </Pressable>
            </View>
          </CyberCard>
        ))}
      </ScrollView>
    );
  }

  function renderVault() {
    return (
      <ScrollView contentContainerStyle={styles.callsWrap} showsVerticalScrollIndicator={false}>
        {stackBlueprint.map((item, index) => {
          const tone = toneKeys[index % toneKeys.length];
          const panel = theme.panels[tone];

          return (
            <CyberCard key={item.label} tone={tone} theme={theme} style={styles.vaultCard}>
              <Text style={[styles.vaultLabel, { color: panel.text }]}>SYSTEM</Text>
              <Text style={[styles.vaultTitle, { color: panel.text, fontFamily: theme.fonts.display }]}>
                {item.label}
              </Text>
              <Text style={[styles.vaultBody, { color: panel.text }]}>{item.detail}</Text>
            </CyberCard>
          );
        })}
      </ScrollView>
    );
  }

  const tabs = ['Chats', 'Calls', 'Vault'];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.shell, { backgroundColor: theme.colors.canvas }]}>
        <View style={styles.topBar}>
          <Text style={[styles.brand, { color: theme.colors.text, fontFamily: theme.fonts.display }]}>
            CBRPNK CHAT
          </Text>
          <TextInput
            placeholder="Search users, files, threads"
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                borderColor: theme.colors.line,
                backgroundColor: theme.colors.surface,
              },
            ]}
          />
          {screenError ? <Text style={[styles.screenError, { color: theme.colors.alert }]}>{screenError}</Text> : null}
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: active ? theme.colors.neon : theme.colors.surfaceAlt,
                    borderColor: active ? theme.colors.neon : theme.colors.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? theme.colors.ink : theme.colors.textMuted,
                      fontFamily: theme.fonts.display,
                    },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'Chats' ? renderChats() : null}
        {activeTab === 'Calls' ? renderCalls() : null}
        {activeTab === 'Vault' ? renderVault() : null}
      </View>

      <CallOverlay
        visible={callVisible}
        onClose={() => setCallVisible(false)}
        theme={theme}
        chat={selectedChat}
      />
      <CreateChatOverlay
        visible={createChatVisible}
        theme={theme}
        users={userResults}
        loading={usersLoading}
        mode={createChatMode}
        groupName={groupDraft.name}
        groupDescription={groupDraft.description}
        query={userQuery}
        selectedIds={selectedUserIds}
        onClose={closeCreateChat}
        onModeChange={(mode) => {
          setCreateChatMode(mode);
          setSelectedUserIds([]);
        }}
        onQueryChange={setUserQuery}
        onGroupNameChange={(value) => setGroupDraft((current) => ({ ...current, name: value }))}
        onGroupDescriptionChange={(value) =>
          setGroupDraft((current) => ({ ...current, description: value }))
        }
        onToggleUser={toggleUserSelection}
        onSubmit={handleCreateChatSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shell: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  topBar: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 34,
    letterSpacing: 1.4,
  },
  searchInput: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  screenError: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 1.1,
  },
  authWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  authCard: {
    padding: spacing.lg,
  },
  authModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  authModeButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authModeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  authInput: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  authError: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: spacing.md,
  },
  authSubmit: {
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  authSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  mainGrid: {
    flex: 1,
  },
  mainGridWide: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  sidebar: {
    flex: 1,
  },
  sidebarWide: {
    flexBasis: '38%',
    flexGrow: 0,
  },
  heroCard: {
    padding: spacing.lg,
  },
  heroCode: {
    fontSize: 46,
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
    opacity: 0.84,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  heroStat: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    padding: spacing.md,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroStatValue: {
    fontSize: 28,
    letterSpacing: 1.4,
  },
  backendCard: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  backendDetail: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.88,
  },
  sectionSpacing: {
    marginTop: spacing.sm,
  },
  sectionTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  sectionAction: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  conversationList: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  chatPane: {
    flex: 1,
  },
  chatHeader: {
    padding: spacing.lg,
  },
  chatHeaderTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerMini: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  chatTitle: {
    fontSize: 30,
    letterSpacing: 1.4,
  },
  chatIdentityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  chatIdentityText: {
    flex: 1,
  },
  chatAvatar: {
    borderRadius: 28,
    borderWidth: 1.5,
    height: 56,
    width: 56,
  },
  chatSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginTop: 4,
    opacity: 0.82,
  },
  chatHeaderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  chatCode: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  actionRow: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  actionPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: {
    fontSize: 12,
    letterSpacing: 1.1,
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  typingIndicator: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  callsWrap: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  callCard: {
    padding: spacing.lg,
  },
  callTime: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  callTitle: {
    fontSize: 30,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  callSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  callActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  callAction: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  callActionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  vaultCard: {
    padding: spacing.lg,
  },
  vaultLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  vaultTitle: {
    fontSize: 28,
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  vaultBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
