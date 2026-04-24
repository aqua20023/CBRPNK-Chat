import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { CyberChatApp } from './src/screens/CyberChatApp';
import { createTheme } from './src/theme/theme';

export default function App() {
  const theme = createTheme('dark');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <CyberChatApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
