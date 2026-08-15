import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useUiStore } from '@/store/uiStore';
import { useCalculatorStore } from '@/store/calculatorStore';
import { EQUATION_CATEGORIES } from '@/core/equations';
import type { EquationKey } from '@/core/equations';
import { colors } from '@/theme';

export default function EquationsScreen() {
  const { t, equations } = useLanguage();
  const openEquation = useUiStore((s) => s.openEquation);
  const result = useCalculatorStore((s) => s.result);

  const categoryTitles: Record<string, string> = {
    energy: t.categoryEnergy,
    components: t.categoryComponents,
    currents: t.categoryCurrents,
    efficiency: t.categoryEfficiency,
  };

  const actualValueFor = (key: EquationKey): string | undefined => {
    if (!result) return undefined;
    switch (key) {
      case 'totalEnergy':
        return `${result.energy} kWh`;
      case 'peakPower':
        return `${result.peakPower} W`;
      case 'surgePower':
        return `${result.surgePower} W`;
      case 'inverter':
        return `${result.inverter.size} W`;
      case 'batterySeparate':
        return `${result.battery.kwh} kWh (${result.battery.ah} Ah)`;
      case 'solarPanels':
        return `${result.solar.count} x ${result.solar.panelWattage} W`;
      case 'batteryCurrent':
        return `${result.currents.battery} A`;
      case 'solarCurrent':
        return `${result.currents.solar} A`;
      case 'autonomy':
        return `${result.autonomy} ${t.statAutonomy}`;
      default:
        return undefined;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>{t.equationsTitle}</Text>
          <Text style={styles.headerSubtitle}>{t.equationsSubtitle}</Text>
        </Card.Content>
      </Card>

      {EQUATION_CATEGORIES.map((category) => (
        <View key={category.id} style={styles.category}>
          <Text style={styles.categoryTitle}>{categoryTitles[category.id] ?? category.id}</Text>
          <View style={styles.cardsWrap}>
            {category.keys.map((key) => {
              const eq = equations[key];
              return (
                <Card
                  key={key}
                  style={styles.eqCard}
                  onPress={() => openEquation(key, actualValueFor(key))}
                >
                  <Card.Content>
                    <Text style={styles.eqTitle}>{eq.title}</Text>
                    <Text style={styles.eqFormula}>{eq.formula}</Text>
                    <Text style={styles.eqTap}>{t.equationsSubtitle}</Text>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        </View>
      ))}

      <Card style={styles.card}>
        <Card.Title title={t.equationsHowTitle} titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.howText}>{t.eqHow1}</Text>
          <Text style={styles.howText}>{t.eqHow2}</Text>
          <Text style={styles.howText}>{t.eqHow3}</Text>
          <Text style={styles.howText}>{t.eqHow4}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: colors.info,
    marginBottom: 14,
    borderRadius: 15,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 4,
  },
  category: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  cardsWrap: {
    gap: 10,
  },
  eqCard: {
    backgroundColor: colors.card,
  },
  eqTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  eqFormula: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: colors.info,
    backgroundColor: colors.statsBg,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  eqTap: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  howText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
});
