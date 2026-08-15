import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type {
  PanelEfficiency,
  RoofAngle,
  RoofDirection,
  RooftopData,
} from '@/core/types';
import { calculateFromRooftop, roundToTwo } from '@/core/calculator';
import { useLanguage } from '@/i18n/LanguageProvider';
import { NumberField } from '@/components/NumberField';
import { Select } from '@/components/Select';
import { colors } from '@/theme';

interface RooftopSectionProps {
  rooftop: RooftopData;
  onChange: (patch: Partial<RooftopData>) => void;
}

export function RooftopSection({ rooftop, onChange }: RooftopSectionProps) {
  const { t, dir } = useLanguage();

  const directionOptions = [
    { value: 'south', label: t.dirSouth },
    { value: 'southeast', label: t.dirSoutheast },
    { value: 'southwest', label: t.dirSouthwest },
    { value: 'east', label: t.dirEast },
    { value: 'west', label: t.dirWest },
  ];

  const angleOptions = [
    { value: '15', label: t.angle15 },
    { value: '20', label: t.angle20 },
    { value: '25', label: t.angle25 },
    { value: '30', label: t.angle30 },
    { value: '35', label: t.angle35 },
  ];

  const panelOptions = [
    { value: 'standard', label: t.panelStandard },
    { value: 'high', label: t.panelHigh },
    { value: 'premium', label: t.panelPremium },
  ];

  const est = calculateFromRooftop(
    rooftop.area,
    rooftop.direction,
    rooftop.angle,
    rooftop.panelEfficiency,
  );

  return (
    <Card style={styles.card}>
      <Card.Title title={t.rooftopTitle} titleStyle={styles.cardTitle} />
      <Card.Content>
        <Text style={styles.subtitle}>{t.rooftopSubtitle}</Text>

        <View style={styles.row}>
          <View style={styles.flex}>
            <NumberField
              label={t.roofArea}
              value={rooftop.area}
              onValueChange={(area) => onChange({ area })}
            />
            <Text style={styles.hint}>{t.roofAreaHint}</Text>
          </View>
          <View style={styles.flex}>
            <Select
              label={t.roofDirection}
              value={rooftop.direction}
              options={directionOptions}
              onSelect={(v) => onChange({ direction: v as RoofDirection })}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex}>
            <Select
              label={t.roofAngle}
              value={rooftop.angle}
              options={angleOptions}
              onSelect={(v) => onChange({ angle: v as RoofAngle })}
            />
          </View>
          <View style={styles.flex}>
            <Select
              label={t.panelType}
              value={rooftop.panelEfficiency}
              options={panelOptions}
              onSelect={(v) => onChange({ panelEfficiency: v as PanelEfficiency })}
            />
          </View>
        </View>

        <View style={styles.warning}>
          <Text style={[styles.warningText, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {t.rooftopWarning}
          </Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.rooftopMaxPower} ${est.maxPower} ${t.statKwhDay.split('/')[0]} `}
          </Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.rooftopPanelCount} ${est.panelCount} ${t.rooftopPanelSuffix}`}
          </Text>
          <Text style={[styles.estLine, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {`${t.rooftopRequiredArea} ${roundToTwo(est.panelCount * 2)} ${t.rooftopApprox}`}
          </Text>
          <Text style={[styles.estNote, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
            {t.rooftopAreaNote}
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
  warning: {
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
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
