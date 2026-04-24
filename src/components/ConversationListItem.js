import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/theme';
import { CyberCard } from './CyberCard';

export function ConversationListItem({ chat, active, theme, onPress }) {
  const panel = theme.panels[chat.tone];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: active ? 1 : 0,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [active, animatedValue]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      <Pressable onPress={onPress}>
      <CyberCard
        tone={chat.tone}
        theme={theme}
        style={[
          styles.card,
          active && {
            borderWidth: 2.5,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.code, { color: panel.text, fontFamily: theme.fonts.display }]}>
            {chat.code}
          </Text>
          <View style={styles.rightMeta}>
            {chat.pinned ? <Text style={[styles.metaText, { color: panel.text }]}>PIN</Text> : null}
            <Text style={[styles.metaText, { color: panel.text }]}>{chat.timestamp}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.identityRow}>
            <Image source={{ uri: chat.avatarUrl }} style={[styles.avatar, { borderColor: panel.border }]} />
            <Text style={[styles.title, { color: panel.text, fontFamily: theme.fonts.display }]}>
              {chat.title}
            </Text>
          </View>
          <View
            style={[
              styles.presence,
              { backgroundColor: chat.online ? theme.colors.success : panel.border },
            ]}
          />
        </View>

        <Text style={[styles.preview, { color: panel.text, fontFamily: theme.fonts.body }]}>
          {chat.preview}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, { color: panel.text, borderColor: panel.border }]}>
              {chat.type}
            </Text>
            <Text style={[styles.metaText, { color: panel.text }]}>
              {chat.memberCount} NODES
            </Text>
          </View>
          {chat.unread ? (
            <View style={[styles.unread, { backgroundColor: panel.border }]}>
              <Text style={[styles.unreadText, { color: panel.base }]}>{chat.unread}</Text>
            </View>
          ) : (
            <Text style={[styles.metaText, { color: panel.text }]}>SYNCED</Text>
          )}
        </View>
      </CyberCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  identityRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rightMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  avatar: {
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    width: 36,
  },
  code: {
    fontSize: 22,
    letterSpacing: 1.5,
  },
  title: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 1,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
    opacity: 0.88,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  unread: {
    alignItems: 'center',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: spacing.xs,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presence: {
    borderRadius: 999,
    height: 10,
    marginLeft: spacing.sm,
    width: 10,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
});
