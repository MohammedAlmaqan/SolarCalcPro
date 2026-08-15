import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/i18n/LanguageProvider';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabCalculator,
          tabBarIcon: ({ color, size }) => <Ionicons name="calculator" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="equations"
        options={{
          title: t.tabEquations,
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabHistory,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
