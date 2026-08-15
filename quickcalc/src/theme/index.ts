import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const colors = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryBg: '#e8f5e9',
  secondary: '#FF9800',
  info: '#2196F3',
  infoBg: '#e3f2fd',
  danger: '#f44336',
  dangerBg: '#ffebee',
  warningBg: '#fff3cd',
  bg: '#f5f5f5',
  card: '#ffffff',
  text: '#212121',
  textMuted: '#666666',
  border: '#e0e0e0',
  statsBg: '#f8f9fa',
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#ffffff',
    secondary: colors.secondary,
    background: colors.bg,
    surface: colors.card,
    surfaceVariant: colors.statsBg,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
    outline: colors.border,
    error: colors.danger,
  },
  fonts: MD3LightTheme.fonts,
};
