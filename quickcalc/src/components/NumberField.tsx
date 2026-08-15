import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { colors } from '@/theme';

interface NumberFieldProps {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  error?: boolean;
  compact?: boolean;
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function NumberField({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  error,
  compact,
}: NumberFieldProps) {
  const [text, setText] = useState(value === 0 ? '' : String(value));
  const [focused, setFocused] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    if (!focused) {
      setText(value === 0 ? '' : String(value));
    }
  }

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        mode="outlined"
        dense
        keyboardType="numeric"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        onChangeText={(t) => {
          setText(t);
          onValueChange(parseNumber(t));
        }}
        style={styles.input}
        outlineStyle={{ borderWidth: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    flex: 1,
    minWidth: 60,
  },
  compact: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 3,
  },
  input: {
    backgroundColor: colors.card,
    minHeight: 42,
  },
});
