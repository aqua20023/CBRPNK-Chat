import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing } from '../theme/theme';

function MessageStatus({ status, theme }) {
  const labels = {
    sent: 'SENT',
    delivered: 'DLVD',
    seen: 'SEEN',
  };

  return (
    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
      {labels[status] || '...'}
    </Text>
  );
}

function ReactionStrip({ reactions, theme }) {
  if (!reactions?.length) {
    return null;
  }

  return (
    <View style={styles.reactionRow}>
      {reactions.map((reaction, index) => (
        <View
          key={`${reaction}-${index}`}
          style={[styles.reactionPill, { backgroundColor: theme.colors.surfaceAlt }]}
        >
          <Text style={styles.reactionText}>{reaction}</Text>
        </View>
      ))}
    </View>
  );
}

export function MessageBubble({
  message,
  theme,
  selected,
  replyPreview,
  onPress,
}) {
  const bubbleTone = message.fromMe ? theme.panels.mustard : theme.panels.fog;
  const bubbleBackground = message.fromMe ? bubbleTone.soft : theme.colors.surface;
  const bubbleColor = message.fromMe ? bubbleTone.text : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrapper,
        message.fromMe ? styles.mine : styles.theirs,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBackground,
            borderColor: selected ? theme.colors.alert : theme.colors.line,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.author, { color: bubbleColor, fontFamily: theme.fonts.display }]}>
            {message.author}
          </Text>
          <Text style={[styles.metaText, { color: bubbleColor }]}>
            {message.pinned ? 'PIN' : ''}
          </Text>
        </View>

        {replyPreview ? (
          <View style={[styles.replyCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.replyLabel, { color: theme.colors.textMuted }]}>REPLY</Text>
            <Text style={[styles.replyBody, { color: bubbleColor }]} numberOfLines={2}>
              {replyPreview}
            </Text>
          </View>
        ) : null}

        {message.deleted ? (
          <Text style={[styles.deletedText, { color: bubbleColor }]}>
            Message deleted
          </Text>
        ) : null}

        {!message.deleted && message.kind === 'text' ? (
          <Text style={[styles.body, { color: bubbleColor }]}>{message.text}</Text>
        ) : null}

        {!message.deleted && message.kind === 'file' ? (
          <View style={[styles.featureCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.featureTitle, { color: bubbleColor }]}>{message.fileType}</Text>
            <Text style={[styles.body, { color: bubbleColor }]}>{message.title}</Text>
            <Text style={[styles.metaText, { color: bubbleColor }]}>
              {message.size} / {message.text}
            </Text>
          </View>
        ) : null}

        {!message.deleted && message.kind === 'voice' ? (
          <View style={[styles.featureCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.featureTitle, { color: bubbleColor }]}>VOICE NOTE</Text>
            <View style={styles.waveform}>
              {message.waveform.map((value, index) => (
                <View
                  key={`${message.id}-wave-${index}`}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: bubbleColor,
                      height: 12 + value * 26,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.metaText, { color: bubbleColor }]}>{message.duration}</Text>
          </View>
        ) : null}

        {!message.deleted && message.kind === 'poll' ? (
          <View style={[styles.featureCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.featureTitle, { color: bubbleColor }]}>POLL</Text>
            <Text style={[styles.body, { color: bubbleColor }]}>{message.text}</Text>
            {message.options.map((option) => {
              const width = `${Math.max(18, Math.min(100, option.votes * 4))}%`;
              return (
                <View key={option.label} style={styles.pollRow}>
                  <View style={[styles.pollTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <View style={[styles.pollFill, { width, backgroundColor: theme.colors.alert }]} />
                  </View>
                  <Text style={[styles.metaText, { color: bubbleColor }]}>
                    {option.label} / {option.votes}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {!message.deleted && message.kind === 'location' ? (
          <View style={[styles.featureCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.featureTitle, { color: bubbleColor }]}>LOCATION</Text>
            <Text style={[styles.body, { color: bubbleColor }]}>{message.location}</Text>
            <Text style={[styles.metaText, { color: bubbleColor }]}>{message.coordinates}</Text>
          </View>
        ) : null}

        {!message.deleted && message.kind === 'link' ? (
          <View style={[styles.featureCard, { borderColor: theme.colors.line }]}>
            <Text style={[styles.featureTitle, { color: bubbleColor }]}>{message.urlDomain}</Text>
            <Text style={[styles.body, { color: bubbleColor }]}>{message.urlTitle}</Text>
            <Text style={[styles.metaText, { color: bubbleColor }]}>{message.urlExcerpt}</Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={[styles.metaText, { color: bubbleColor }]}>{message.time}</Text>
          {message.fromMe ? <MessageStatus status={message.status} theme={theme} /> : null}
        </View>
        <ReactionStrip reactions={message.reactions} theme={theme} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    maxWidth: '88%',
  },
  mine: {
    alignSelf: 'flex-end',
  },
  theirs: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  author: {
    fontSize: 14,
    letterSpacing: 1,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  featureCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  waveform: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginVertical: spacing.sm,
  },
  waveBar: {
    borderRadius: 999,
    width: 5,
  },
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  reactionPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  reactionText: {
    fontSize: 12,
  },
  pollRow: {
    marginTop: spacing.sm,
  },
  pollTrack: {
    borderRadius: 999,
    height: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  pollFill: {
    borderRadius: 999,
    height: '100%',
  },
  replyCard: {
    borderLeftWidth: 2,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  replyLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  replyBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  deletedText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.76,
  },
});
