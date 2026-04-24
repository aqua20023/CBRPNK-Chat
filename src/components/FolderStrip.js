import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { spacing } from '../theme/theme';

export function FolderStrip({ folders, selected, onSelect, theme }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {folders.map((folder, index) => {
        const item = typeof folder === 'string' ? { key: folder, label: folder } : folder;
        const toneKeys = ['mustard', 'olive', 'fog', 'salmon'];
        const tone = theme.panels[toneKeys[index % toneKeys.length]];
        const active = item.key === selected;

        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? tone.base : theme.colors.surfaceAlt,
                borderColor: active ? tone.border : theme.colors.line,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: active ? tone.text : theme.colors.textMuted,
                  fontFamily: theme.fonts.display,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: 13,
    letterSpacing: 1.2,
  },
});
