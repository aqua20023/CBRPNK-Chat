import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { chats as initialChats, callMoments, folders, messagesByChat as initialMessages, stackBlueprint } from '../data/mockData';
import { createTheme, radii, spacing } from '../theme/theme';
import { CyberCard } from '../components/CyberCard';
import { ConversationListItem } from '../components/ConversationListItem';
import { FolderStrip } from '../components/FolderStrip';
import { MessageBubble } from '../components/MessageBubble';
import { ComposerDock } from '../components/ComposerDock';
import { CallOverlay } from '../components/CallOverlay';

function cloneMessages() {
  return JSON.parse(JSON.stringify(initialMessages));
}

function formatStatusSequence(updateMessageStatus, chatId, messageId) {
  setTimeout(() => updateMessageStatus(chatId, messageId, 'delivered'), 700);
  setTimeout(() => updateMessageStatus(chatId, messageId, 'seen'), 1600);
}

function buildReplySnippet(messages, replyToId) {
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

function createAutoReply(chat) {
  const scripts = {
    'ua-570-b': 'Copy that. I am turning the telemetry cards into the primary reading rhythm.',
    ts26: 'Thread updated. Search, folders, and pin logic all stay visible in the first fold.',
    'retro-25': 'Dropping sticker variants next. The composer will feel much more alive.',
    'sector-01': 'Call lane synced. Screen-share affordance will stay one tap away.',
  };

  return scripts[chat.id] || 'Signal received. Continuing with the next pass.';
}

export function CyberChatApp() {
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const [themeMode, setThemeMode] = useState('dark');
  const [activeTab, setActiveTab] = useState('Inbox');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0].id);
  const [mobilePanel, setMobilePanel] = useState('list');
  const [composerValue, setComposerValue] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [typingChatId, setTypingChatId] = useState('ts26');
  const [callVisible, setCallVisible] = useState(false);
  const [chatState, setChatState] = useState(initialChats);
  const [messageState, setMessageState] = useState(cloneMessages);

  const theme = createTheme(themeMode);

  useEffect(() => {
    if (isWide) {
      setMobilePanel('chat');
    }
  }, [isWide]);

  const visibleChats = chatState.filter((chat) => {
    const folderMatch = selectedFolder === 'All' || chat.tags.includes(selectedFolder);
    const query = search.trim().toLowerCase();
    const queryMatch =
      !query ||
      chat.title.toLowerCase().includes(query) ||
      chat.preview.toLowerCase().includes(query) ||
      chat.code.toLowerCase().includes(query);

    return folderMatch && queryMatch;
  });

  const selectedChat = chatState.find((chat) => chat.id === selectedChatId) || visibleChats[0] || chatState[0];
  const allMessages = messageState[selectedChat?.id] || [];
  const visibleMessages = allMessages.filter((message) => {
    const query = search.trim().toLowerCase();
    if (!query || activeTab !== 'Inbox') {
      return true;
    }

    return (
      (message.text || '').toLowerCase().includes(query) ||
      (message.title || '').toLowerCase().includes(query) ||
      (message.location || '').toLowerCase().includes(query) ||
      (message.urlTitle || '').toLowerCase().includes(query)
    );
  });

  function updateMessageStatus(chatId, messageId, status) {
    setMessageState((current) => ({
      ...current,
      [chatId]: current[chatId].map((message) =>
        message.id === messageId ? { ...message, status } : message,
      ),
    }));
  }

  function appendMessage(chatId, message) {
    setMessageState((current) => ({
      ...current,
      [chatId]: [...(current[chatId] || []), message],
    }));
  }

  function pushCompanionReply(chat) {
    setTypingChatId(chat.id);

    setTimeout(() => {
      appendMessage(chat.id, {
        id: `auto-${Date.now()}`,
        kind: 'text',
        author: chat.title.split('/')[0].trim(),
        fromMe: false,
        text: createAutoReply(chat),
        time: 'NOW',
        status: 'delivered',
        reactions: ['SYNC'],
      });
      setTypingChatId(null);
    }, 1300);
  }

  function handleSelectChat(chatId) {
    setSelectedChatId(chatId);
    setSelectedMessageId(null);
    setReplyTarget(null);
    setChatState((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat)),
    );
    if (!isWide) {
      setMobilePanel('chat');
    }
  }

  function handleSend() {
    if (!composerValue.trim() || !selectedChat) {
      return;
    }

    const messageId = `out-${Date.now()}`;

    appendMessage(selectedChat.id, {
      id: messageId,
      kind: 'text',
      author: 'You',
      fromMe: true,
      text: composerValue.trim(),
      time: 'NOW',
      status: 'sent',
      replyTo: replyTarget?.id,
      reactions: [],
    });

    setComposerValue('');
    setReplyTarget(null);
    formatStatusSequence(updateMessageStatus, selectedChat.id, messageId);
    pushCompanionReply(selectedChat);
  }

  function handleQuickAction(action) {
    if (!selectedChat) {
      return;
    }

    if (action === 'Call') {
      setCallVisible(true);
      return;
    }

    const payloads = {
      Voice: {
        kind: 'voice',
        text: 'Field note',
        duration: '0:19',
        waveform: [0.6, 0.3, 0.7, 0.9, 0.2, 0.5, 0.8, 0.6, 0.5, 0.9],
      },
      Poll: {
        kind: 'poll',
        text: 'Choose the next motion pass',
        options: [
          { label: 'Conversation hover', votes: 8 },
          { label: 'Composer launch', votes: 12 },
          { label: 'Presence pulse', votes: 4 },
        ],
      },
      GIF: {
        kind: 'text',
        text: 'Dropped a brutalist GIF loop into the thread.',
        reactions: ['GIF'],
      },
      Locate: {
        kind: 'location',
        text: 'Location beacon shared',
        location: 'Cyber Yard - Sector 7',
        coordinates: '28.6139, 77.2090',
      },
      Doc: {
        kind: 'file',
        title: 'AESTHETIC_SYSTEM_v1.pdf',
        text: 'Theme spec, typography hierarchy, and animation notes.',
        fileType: 'PDF',
        size: '2.1 MB',
      },
    };

    const payload = payloads[action];
    if (!payload) {
      return;
    }

    const messageId = `action-${Date.now()}`;
    appendMessage(selectedChat.id, {
      id: messageId,
      author: 'You',
      fromMe: true,
      time: 'NOW',
      status: 'sent',
      reactions: [],
      ...payload,
    });
    formatStatusSequence(updateMessageStatus, selectedChat.id, messageId);
  }

  function handleMessageAction(action) {
    if (!selectedMessageId || !selectedChat) {
      return;
    }

    const target = (messageState[selectedChat.id] || []).find((message) => message.id === selectedMessageId);
    if (!target) {
      return;
    }

    if (action === 'Reply') {
      setReplyTarget(target);
      return;
    }

    if (action === 'Forward') {
      appendMessage(selectedChat.id, {
        id: `forward-${Date.now()}`,
        kind: 'text',
        author: 'You',
        fromMe: true,
        text: `Forwarded: ${target.text || target.title || target.location || 'Attachment'}`,
        time: 'NOW',
        status: 'sent',
        reactions: ['FWD'],
      });
      return;
    }

    setMessageState((current) => ({
      ...current,
      [selectedChat.id]: current[selectedChat.id].map((message) => {
        if (message.id !== selectedMessageId) {
          return message;
        }

        if (action === 'React') {
          const reactions = message.reactions || [];
          return {
            ...message,
            reactions: reactions.includes('FIRE')
              ? reactions.filter((item) => item !== 'FIRE')
              : [...reactions, 'FIRE'],
          };
        }

        if (action === 'Pin') {
          return { ...message, pinned: !message.pinned };
        }

        if (action === 'Edit' && message.kind === 'text' && message.fromMe && !message.deleted) {
          return { ...message, text: `${message.text} [edited]` };
        }

        if (action === 'Delete') {
          return { ...message, deleted: true, reactions: [] };
        }

        return message;
      }),
    }));
  }

  function toggleChatPin() {
    if (!selectedChat) {
      return;
    }

    setChatState((current) =>
      current.map((chat) => (chat.id === selectedChat.id ? { ...chat, pinned: !chat.pinned } : chat)),
    );
  }

  function renderInbox() {
    return (
      <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
        <View style={[styles.sidebar, isWide && styles.sidebarWide]}>
          <CyberCard tone="mustard" theme={theme} style={styles.heroCard}>
            <Text style={[styles.heroCode, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
              CBRPNK
            </Text>
            <Text style={[styles.heroTitle, { color: theme.colors.ink }]}>
              Aesthetic messaging system tuned to your reference board.
            </Text>
            <Text style={[styles.heroBody, { color: theme.colors.ink }]}>
              Real-time chat, folders, reactions, calls, media, polls, and dark mode all shaped with industrial cards and sharp telemetry labels.
            </Text>
            <View style={styles.heroStats}>
              <View style={[styles.heroStat, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>LIVE</Text>
                <Text style={[styles.heroStatValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                  571
                </Text>
              </View>
              <View style={[styles.heroStat, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.heroStatLabel, { color: theme.colors.ink }]}>SYNC</Text>
                <Text style={[styles.heroStatValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                  2.47
                </Text>
              </View>
            </View>
          </CyberCard>

          <View style={styles.sectionSpacing}>
            <FolderStrip
              folders={folders}
              selected={selectedFolder}
              onSelect={setSelectedFolder}
              theme={theme}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conversationList}>
            {visibleChats.map((chat) => (
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

        {(isWide || mobilePanel === 'chat') && selectedChat ? renderChatPanel() : null}
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
          const toneKeys = ['mustard', 'olive', 'fog', 'salmon'];
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
                {typingChatId === selectedChat?.id ? 'TYPING...' : selectedChat?.online ? 'ONLINE' : 'OFFLINE'}
              </Text>
              <Pressable onPress={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}>
                <Text style={[styles.headerMini, { color: theme.colors.ink }]}>
                  {themeMode === 'dark' ? 'LIGHT' : 'DARK'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.chatTitle, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
            {selectedChat?.title}
          </Text>

          <View style={styles.chatHeaderMeta}>
            <Text style={[styles.chatCode, { color: theme.colors.ink }]}>{selectedChat?.code}</Text>
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

        <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.messageContent}>
          {typingChatId === selectedChat?.id ? (
            <Text style={[styles.typingIndicator, { color: theme.colors.textMuted }]}>
              {selectedChat.title} is typing...
            </Text>
          ) : null}

          {visibleMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              theme={theme}
              selected={message.id === selectedMessageId}
              replyPreview={buildReplySnippet(allMessages, message.replyTo)}
              onPress={() => setSelectedMessageId((current) => (current === message.id ? null : message.id))}
            />
          ))}
        </ScrollView>

        <ComposerDock
          theme={theme}
          value={composerValue}
          onChange={setComposerValue}
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
          const toneKeys = ['mustard', 'olive', 'fog', 'salmon'];
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

  const tabs = ['Inbox', 'Calls', 'Vault'];

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

        {activeTab === 'Inbox' ? renderInbox() : null}
        {activeTab === 'Calls' ? renderCalls() : null}
        {activeTab === 'Vault' ? renderVault() : null}
      </View>

      <CallOverlay
        visible={callVisible}
        onClose={() => setCallVisible(false)}
        theme={theme}
        chat={selectedChat}
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
  sectionSpacing: {
    marginTop: spacing.sm,
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
