import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing } from '../theme/theme';
import { CyberCard } from './CyberCard';

const lanes = [
  { label: 'VOICE', value: 'ACTIVE' },
  { label: 'VIDEO', value: 'READY' },
  { label: 'SCREEN', value: 'SHARE' },
];

export function CallOverlay({ visible, onClose, theme, chat }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <CyberCard tone={chat?.tone || 'mustard'} theme={theme} style={styles.modalCard}>
          <Text style={[styles.kicker, { color: theme.colors.ink }]}>LIVE COMMS</Text>
          <Text style={[styles.title, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
            {chat?.title || 'CHANNEL'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.ink }]}>
            WebRTC-ready voice, video, and screen-share surface
          </Text>

          <View style={styles.grid}>
            {lanes.map((lane) => (
              <View key={lane.label} style={[styles.lane, { borderColor: theme.colors.ink }]}>
                <Text style={[styles.laneLabel, { color: theme.colors.ink }]}>{lane.label}</Text>
                <Text style={[styles.laneValue, { color: theme.colors.ink, fontFamily: theme.fonts.display }]}>
                  {lane.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={[styles.footerButton, { borderColor: theme.colors.ink }]}>
              <Text style={[styles.footerText, { color: theme.colors.ink }]}>END</Text>
            </Pressable>
            <Pressable onPress={onClose} style={[styles.footerButton, { backgroundColor: theme.colors.ink }]}>
              <Text style={[styles.footerText, { color: theme.colors.neon }]}>JOIN</Text>
            </Pressable>
          </View>
        </CyberCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    padding: spacing.xl,
    width: '100%',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 34,
    letterSpacing: 1.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  grid: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  lane: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  laneLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  laneValue: {
    fontSize: 28,
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  footerButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
});
