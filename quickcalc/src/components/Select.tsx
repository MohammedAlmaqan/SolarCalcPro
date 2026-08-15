import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { useLanguage } from '@/i18n/LanguageProvider';
import { colors } from '@/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function Select({ label, value, options, onSelect, disabled }: SelectProps) {
  const { dir } = useLanguage();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            style={[
              styles.input,
              { flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' },
              disabled && styles.disabled,
            ]}
            onPress={() => !disabled && setOpen(true)}
          >
            <Text style={styles.selected} numberOfLines={1}>
              {selected?.label ?? value}
            </Text>
            <Text style={styles.caret}>▾</Text>
          </Pressable>
        }
      >
        {options.map((o) => (
          <Menu.Item
            key={o.value}
            title={o.label}
            onPress={() => {
              onSelect(o.value);
              setOpen(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    minHeight: 44,
    alignItems: 'center',
  },
  selected: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  caret: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});
