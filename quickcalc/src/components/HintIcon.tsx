import { Pressable, StyleSheet, Text } from 'react-native';
import { useUiStore } from '@/store/uiStore';
import type { EquationKey } from '@/core/equations';
import { colors } from '@/theme';

interface HintIconProps {
  equationKey: EquationKey;
  actualValue?: string;
}

export function HintIcon({ equationKey, actualValue }: HintIconProps) {
  const openEquation = useUiStore((s) => s.openEquation);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Show equation"
      hitSlop={8}
      style={styles.icon}
      onPress={() => openEquation(equationKey, actualValue)}
    >
      <Text style={styles.text}>?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});
