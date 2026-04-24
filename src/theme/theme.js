import { Platform } from 'react-native';

const displayFamily = Platform.select({
  ios: 'AvenirNextCondensed-Heavy',
  android: 'sans-serif-condensed',
  default: 'system',
});

const bodyFamily = Platform.select({
  ios: 'AvenirNext-Regular',
  android: 'sans-serif-medium',
  default: 'system',
});

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
};

const sharedPanels = {
  mustard: {
    base: '#E6A55B',
    soft: '#F0B874',
    border: '#1A1714',
    accent: '#B65C4D',
    text: '#13100D',
  },
  olive: {
    base: '#7B9B72',
    soft: '#94B28D',
    border: '#172015',
    accent: '#0D1712',
    text: '#10150F',
  },
  salmon: {
    base: '#B86055',
    soft: '#CD7668',
    border: '#180F0D',
    accent: '#251613',
    text: '#140F0E',
  },
  fog: {
    base: '#B9B7B7',
    soft: '#D2CFCE',
    border: '#1C1A1A',
    accent: '#B65C4D',
    text: '#121212',
  },
};

export function createTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  return {
    mode,
    fonts: {
      display: displayFamily,
      body: bodyFamily,
      mono: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
    },
    colors: {
      background: isDark ? '#050505' : '#ECE5DE',
      canvas: isDark ? '#0C0C0C' : '#F6F1EA',
      surface: isDark ? '#111111' : '#FFFFFF',
      surfaceAlt: isDark ? '#181818' : '#E7DDD5',
      surfaceStrong: isDark ? '#1E1B19' : '#D8CABE',
      line: isDark ? '#2A2724' : '#6E655E',
      text: isDark ? '#F6EDE3' : '#191715',
      textMuted: isDark ? '#B5A89A' : '#645951',
      neon: '#E6A55B',
      alert: '#B86055',
      success: '#7B9B72',
      fog: '#B9B7B7',
      ink: '#050505',
    },
    panels: sharedPanels,
    shadow: {
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  };
}
