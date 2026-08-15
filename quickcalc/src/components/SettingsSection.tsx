import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox } from 'react-native-paper';
import type { BatteryType, SystemSettings, SystemVoltage } from '@/core/types';
import { SUN_HOURS_MAP } from '@/core/constants';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Select } from '@/components/Select';
import { NumberField } from '@/components/NumberField';
import { HintIcon } from '@/components/HintIcon';
import { colors } from '@/theme';

interface SettingsSectionProps {
  settings: SystemSettings;
  onChange: (patch: Partial<SystemSettings>) => void;
}

export function SettingsSection({ settings, onChange }: SettingsSectionProps) {
  const { t, dir } = useLanguage();

  const regionOptions = [
    { value: 'sunny', label: t.regionSunny },
    { value: 'moderate', label: t.regionModerate },
    { value: 'cloudy', label: t.regionCloudy },
    { value: 'northern', label: t.regionNorthern },
  ];

  const voltageOptions = [
    { value: '12', label: t.voltage12 },
    { value: '24', label: t.voltage24 },
    { value: '48', label: t.voltage48 },
    { value: '96', label: t.voltage96 },
  ];

  const batteryOptions = [
    { value: 'lifepo4', label: t.batteryLifepo4 },
    { value: 'lithium', label: t.batteryLithium },
    { value: 'lead_acid', label: t.batteryLeadAcid },
  ];

  const dodOptions = [50, 60, 70, 80, 85, 90].map((v) => ({
    value: String(v),
    label:
      v === 50 ? t.dod50 : v === 60 ? t.dod60 : v === 70 ? t.dod70 : v === 80 ? t.dod80 : v === 85 ? t.dod85 : t.dod90,
  }));

  return (
    <Card style={styles.card}>
      <Card.Title title={t.settingsTitle} titleStyle={styles.cardTitle} />
      <Card.Content>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Select
              label={t.regionLabel}
              value={settings.region}
              options={regionOptions}
              onSelect={(region) => {
                onChange({ region: region as SystemSettings['region'] });
                onChange({ sunHours: SUN_HOURS_MAP[region as keyof typeof SUN_HOURS_MAP] });
              }}
            />
          </View>
          <View style={styles.flex}>
            <NumberField
              label={t.sunHoursLabel}
              value={settings.sunHours}
              onValueChange={(sunHours) => onChange({ sunHours })}
            />
            <Text style={styles.hint}>{t.sunHoursHint}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex}>
            <Select
              label={t.systemVoltageLabel}
              value={String(settings.systemVoltage)}
              options={voltageOptions}
              onSelect={(v) => onChange({ systemVoltage: Number(v) as SystemVoltage })}
            />
          </View>
          <View style={styles.flex}>
            <Select
              label={t.batteryTypeLabel}
              value={settings.batteryType}
              options={batteryOptions}
              onSelect={(v) => onChange({ batteryType: v as BatteryType })}
            />
          </View>
        </View>

        <Select
          label={t.dodLabel}
          value={String(settings.dod)}
          options={dodOptions}
          onSelect={(v) => onChange({ dod: Number(v) })}
        />

        <View style={styles.checkRow}>
          <View style={styles.checkBoxWrap}>
            <Checkbox
              status={settings.expandFuture ? 'checked' : 'unchecked'}
              onPress={() => onChange({ expandFuture: !settings.expandFuture })}
            />
            <Text style={styles.checkLabel}>{t.expandFuture}</Text>
          </View>
          <View style={styles.checkBoxWrap}>
            <Checkbox
              status={settings.backupDaysEnabled ? 'checked' : 'unchecked'}
              onPress={() => onChange({ backupDaysEnabled: !settings.backupDaysEnabled })}
            />
            <Text style={styles.checkLabel}>{t.backupDays}</Text>
          </View>
        </View>

        {settings.backupDaysEnabled ? (
          <View style={styles.row}>
            <View style={styles.flex}>
              <NumberField
                label={t.backupDaysCount}
                value={settings.backupDaysCount}
                onValueChange={(backupDaysCount) => onChange({ backupDaysCount })}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.note}>
          <Text style={[styles.noteTitle, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {t.voltageGuideNote} <HintIcon equationKey="voltageGuide" />
          </Text>
          <View style={styles.noteList}>
            <Text style={styles.noteItem}>{t.voltageGuide12}</Text>
            <Text style={styles.noteItem}>{t.voltageGuide24}</Text>
            <Text style={styles.noteItem}>{t.voltageGuide48}</Text>
            <Text style={styles.noteItem}>{t.voltageGuide96}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: colors.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: -6,
  },
  checkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  checkBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 160,
    flex: 1,
  },
  checkLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  note: {
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteTitle: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  noteList: {
    gap: 4,
  },
  noteItem: {
    fontSize: 13,
    color: colors.text,
  },
});
