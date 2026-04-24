import { StyleSheet, View } from 'react-native';
import { radii } from '../theme/theme';

export function CyberCard({ children, tone, theme, style }) {
  const panel = theme.panels[tone] || theme.panels.fog;

  return (
    <View
      style={[
        styles.card,
        theme.shadow,
        {
          backgroundColor: panel.base,
          borderColor: panel.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
});
