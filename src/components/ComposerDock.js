import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { radii, spacing } from '../theme/theme';

const quickActions = ['Voice', 'Poll', 'GIF', 'Locate', 'Doc', 'Call'];

export function ComposerDock({
  theme,
  value,
  onChange,
  onSend,
  onQuickAction,
  replyTarget,
  onClearReply,
}) {
  return (
    <View style={[styles.shell, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.line }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionRow}
      >
        {quickActions.map((action, index) => {
          const toneKeys = ['mustard', 'olive', 'fog', 'salmon'];
          const panel = theme.panels[toneKeys[index % toneKeys.length]];

          return (
            <Pressable
              key={action}
              onPress={() => onQuickAction(action)}
              style={[styles.quickAction, { backgroundColor: panel.base, borderColor: panel.border }]}
            >
              <Text style={[styles.quickActionText, { color: panel.text, fontFamily: theme.fonts.display }]}>
                {action}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {replyTarget ? (
        <View style={[styles.replyBox, { borderColor: theme.colors.line }]}>
          <View style={styles.replyHeader}>
            <Text style={[styles.replyTag, { color: theme.colors.neon }]}>REPLYING</Text>
            <Pressable onPress={onClearReply}>
              <Text style={[styles.replyClear, { color: theme.colors.textMuted }]}>CLEAR</Text>
            </Pressable>
          </View>
          <Text style={[styles.replyText, { color: theme.colors.text }]} numberOfLines={2}>
            {replyTarget.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          multiline
          numberOfLines={4}
          placeholder="Transmit a message..."
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.line,
            },
          ]}
          value={value}
          onChangeText={onChange}
        />
        <Pressable onPress={onSend} style={[styles.sendButton, { backgroundColor: theme.colors.neon }]}>
          <Text style={[styles.sendText, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
            SEND
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  quickActionRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  quickAction: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickActionText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  replyBox: {
    borderLeftWidth: 2,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  replyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replyTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  replyClear: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  sendButton: {
    borderRadius: radii.md,
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sendText: {
    fontSize: 14,
    letterSpacing: 1.4,
  },
});
