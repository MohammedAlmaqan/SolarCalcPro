import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { GlobalEquationDialog } from '@/components/EquationDialog';
import { paperTheme } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#f5f5f5' },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="results" />
          </Stack>
          <GlobalEquationDialog />
        </PaperProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
