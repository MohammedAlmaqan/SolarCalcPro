import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { InputMode } from '@/core/types';
import { useLanguage } from '@/i18n/LanguageProvider';
import { colors } from '@/theme';

interface ModeSelectorProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const { t } = useLanguage();

  const modes: { value: InputMode; label: string; color: string }[] = [
    { value: 'detailed', label: t.modeDetailed, color: colors.primary },
    { value: 'monthly', label: t.modeMonthly, color: '#388E3C' },
    { value: 'rooftop', label: t.modeRooftop, color: colors.info },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t.modeSelectorTitle}</Text>
      <View style={styles.row}>
        {modes.map((m) => {
          const active = mode === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="button"
              onPress={() => onChange(m.value)}
              style={[
                styles.button,
                active && { backgroundColor: m.color, borderColor: m.color },
                !active && { borderColor: m.color },
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={3}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBg,
    minHeight: 64,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  labelActive: {
    color: '#ffffff',
  },
});
