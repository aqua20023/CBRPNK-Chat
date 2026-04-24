import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radii, spacing } from '../theme/theme';
import { CyberCard } from './CyberCard';

export function CreateChatOverlay({
  visible,
  theme,
  users,
  loading,
  mode,
  groupName,
  groupDescription,
  query,
  selectedIds,
  onClose,
  onModeChange,
  onQueryChange,
  onGroupNameChange,
  onGroupDescriptionChange,
  onToggleUser,
  onSubmit,
}) {
  const animation = useRef(new Animated.Value(0)).current;
  const [localVisible, setLocalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
      Animated.spring(animation, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setLocalVisible(false);
      }
    });
  }, [animation, visible]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  if (!localVisible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.panelWrap,
            {
              opacity: animation,
              transform: [{ translateY }],
            },
          ]}
        >
          <CyberCard tone="mustard" theme={theme} style={styles.card}>
            <View style={styles.header}>
              <Text style={[styles.kicker, { color: theme.colors.ink }]}>NEW CHAT</Text>
              <Pressable onPress={onClose}>
                <Text style={[styles.close, { color: theme.colors.ink }]}>CLOSE</Text>
              </Pressable>
            </View>

            <Text style={[styles.title, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
              {mode === 'direct' ? 'DIRECT LINK' : 'GROUP ROOM'}
            </Text>

            <View style={styles.modeRow}>
              {['direct', 'group'].map((entry) => {
                const active = mode === entry;
                return (
                  <Pressable
                    key={entry}
                    onPress={() => onModeChange(entry)}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: active ? theme.colors.ink : 'transparent',
                        borderColor: theme.colors.ink,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        {
                          color: active ? theme.colors.neon : theme.colors.ink,
                        },
                      ]}
                    >
                      {entry.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              placeholder="Search users"
              placeholderTextColor="rgba(19, 16, 13, 0.55)"
              value={query}
              onChangeText={onQueryChange}
              style={[styles.input, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
            />

            {mode === 'group' ? (
              <>
                <TextInput
                  placeholder="Group name"
                  placeholderTextColor="rgba(19, 16, 13, 0.55)"
                  value={groupName}
                  onChangeText={onGroupNameChange}
                  style={[styles.input, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
                />
                <TextInput
                  placeholder="Group description"
                  placeholderTextColor="rgba(19, 16, 13, 0.55)"
                  value={groupDescription}
                  onChangeText={onGroupDescriptionChange}
                  style={[styles.input, { borderColor: theme.colors.ink, color: theme.colors.ink }]}
                />
              </>
            ) : null}

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {loading ? (
                <Text style={[styles.helper, { color: theme.colors.ink }]}>Loading users...</Text>
              ) : null}

              {users.map((user) => {
                const selected = selectedSet.has(String(user._id));
                return (
                  <Pressable
                    key={String(user._id)}
                    onPress={() => onToggleUser(String(user._id))}
                    style={[
                      styles.userRow,
                      {
                        borderColor: theme.colors.ink,
                        backgroundColor: selected ? 'rgba(5, 5, 5, 0.12)' : 'transparent',
                      },
                    ]}
                  >
                    <Image source={{ uri: user.avatarUrl || 'https://via.placeholder.com/300/202020/F3E7D6?text=CB' }} style={[styles.avatar, { borderColor: theme.colors.ink }]} />
                    <View style={styles.userText}>
                      <Text style={[styles.userName, { color: theme.colors.ink }]}>{user.name}</Text>
                      <Text style={[styles.userEmail, { color: theme.colors.ink }]}>{user.email}</Text>
                    </View>
                    <Text style={[styles.userTag, { color: theme.colors.ink }]}>
                      {selected ? 'ADDED' : 'ADD'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable onPress={onSubmit} style={[styles.submit, { backgroundColor: theme.colors.ink }]}>
              <Text style={[styles.submitText, { color: theme.colors.neon }]}>
                {mode === 'direct' ? 'START DIRECT CHAT' : 'CREATE GROUP CHAT'}
              </Text>
            </Pressable>
          </CyberCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panelWrap: {
    maxHeight: '88%',
  },
  card: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  close: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    letterSpacing: 1.3,
    marginTop: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  list: {
    maxHeight: 320,
  },
  helper: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  userRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  avatar: {
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    width: 44,
  },
  userText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.72,
  },
  userTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  submit: {
    alignItems: 'center',
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
});
