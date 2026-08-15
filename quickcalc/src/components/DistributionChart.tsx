import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/theme';
import { useLanguage } from '@/i18n/LanguageProvider';

interface DistributionChartProps {
  dayPercent: number;
  nightPercent: number;
}

export function DistributionChart({ dayPercent, nightPercent }: DistributionChartProps) {
  const { t } = useLanguage();

  return (
    <View>
      <View style={styles.bar}>
        <View style={[styles.day, { flex: dayPercent }]} />
        <View style={[styles.night, { flex: nightPercent }]} />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primaryLight }]} />
          <Text style={styles.legendText}>{`${t.chartDay} ${dayPercent}%`}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>{`${t.chartNight} ${nightPercent}%`}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: 10,
    backgroundColor: '#e0e0e0',
  },
  day: {
    backgroundColor: colors.primaryLight,
  },
  night: {
    backgroundColor: colors.info,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 'bold',
  },
});
