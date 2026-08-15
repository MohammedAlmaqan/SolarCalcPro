import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { ConsumptionPattern, MonthlyData } from '@/core/types';
import { calculateFromMonthly, roundToTwo } from '@/core/calculator';
import { useLanguage } from '@/i18n/LanguageProvider';
import { NumberField } from '@/components/NumberField';
import { Select } from '@/components/Select';
import { colors } from '@/theme';

interface MonthlySectionProps {
  monthly: MonthlyData;
  onChange: (patch: Partial<MonthlyData>) => void;
}

export function MonthlySection({ monthly, onChange }: MonthlySectionProps) {
  const { t, dir } = useLanguage();

  const patternOptions = [
    { value: 'normal', label: t.patternNormal },
    { value: 'day', label: t.patternDay },
    { value: 'night', label: t.patternNight },
    { value: 'balanced', label: t.patternBalanced },
  ];

  const daily = calculateFromMonthly(monthly.consumption, monthly.pattern);
  const monthlyCost = roundToTwo(monthly.consumption * monthly.kwhPrice);

  return (
    <Card style={styles.card}>
      <Card.Title title={t.monthlyTitle} titleStyle={styles.cardTitle} />
      <Card.Content>
        <Text style={styles.subtitle}>{t.monthlySubtitle}</Text>

        <View style={styles.row}>
          <View style={styles.flex}>
            <NumberField
              label={t.monthlyConsumption}
              value={monthly.consumption}
              onValueChange={(consumption) => onChange({ consumption })}
            />
            <Text style={styles.hint}>{t.monthlyConsumptionHint}</Text>
          </View>
          <View style={styles.flex}>
            <NumberField
              label={t.kwhPrice}
              value={monthly.kwhPrice}
              onValueChange={(kwhPrice) => onChange({ kwhPrice })}
            />
            <Text style={styles.hint}>{t.kwhPriceHint}</Text>
          </View>
        </View>

        <Select
          label={t.consumptionPattern}
          value={monthly.pattern}
          options={patternOptions}
          onSelect={(v) => onChange({ pattern: v as ConsumptionPattern })}
        />

        <View style={styles.info}>
          <Text style={styles.infoText}>{t.monthlyHowItWorks}</Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.estimatedDaily} ${daily.total} ${t.statKwhDay}`}
          </Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.distribution} ${daily.day} ${t.dayKwh}، ${daily.night} ${t.nightKwh}`}
          </Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.monthlyCost} ${monthlyCost} ${t.localCurrency}`}
          </Text>
          <Text style={[styles.estNote, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {t.estimateNote}
          </Text>
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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
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
  info: {
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  estLine: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  estNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
