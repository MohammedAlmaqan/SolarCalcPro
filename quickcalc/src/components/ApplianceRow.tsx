import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, TextInput } from 'react-native-paper';
import type { Appliance, DeviceTypeId } from '@/core/types';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Select } from '@/components/Select';
import { NumberField } from '@/components/NumberField';
import { colors } from '@/theme';

interface ApplianceRowProps {
  index: number;
  appliance: Appliance;
  onChange: (patch: Partial<Omit<Appliance, 'id'>>) => void;
  onRemove: () => void;
}

export function ApplianceRow({ index, appliance, onChange, onRemove }: ApplianceRowProps) {
  const { t, deviceTypeNames, dir } = useLanguage();

  const deviceOptions = (Object.keys(deviceTypeNames) as DeviceTypeId[]).map((id) => ({
    value: id,
    label: deviceTypeNames[id],
  }));

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={[styles.numberBadge, { marginRight: dir === 'rtl' ? 0 : 8, marginLeft: dir === 'rtl' ? 8 : 0 }]}>
            <Text style={styles.numberText}>{index}</Text>
          </View>
          <TextInput
            mode="outlined"
            dense
            value={appliance.name}
            placeholder={t.namePlaceholder}
            onChangeText={(name) => onChange({ name })}
            style={styles.nameInput}
          />
          <IconButton icon="delete" iconColor={colors.danger} onPress={onRemove} />
        </View>

        <Select
          label={t.colType}
          value={appliance.type}
          options={deviceOptions}
          onSelect={(value) => onChange({ type: value as DeviceTypeId })}
        />

        <View style={styles.fieldsRow}>
          <NumberField
            label={t.colQty}
            value={appliance.quantity}
            onValueChange={(quantity) => onChange({ quantity })}
            compact
          />
          <NumberField
            label={t.colPower}
            value={appliance.power}
            onValueChange={(power) => onChange({ power })}
            compact
          />
          <NumberField
            label={t.colDayHours}
            value={appliance.dayHours}
            onValueChange={(dayHours) => onChange({ dayHours })}
            compact
          />
          <NumberField
            label={t.colNightHours}
            value={appliance.nightHours}
            onValueChange={(nightHours) => onChange({ nightHours })}
            compact
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.card,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
