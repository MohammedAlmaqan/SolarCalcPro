import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Card, Text, Button, Snackbar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';import { useLanguage } from '@/i18n/LanguageProvider';
import { useCalculatorStore } from '@/store/calculatorStore';
import { buildReportText } from '@/core/report';
import type { EquationKey } from '@/core/equations';
import { DistributionChart } from '@/components/DistributionChart';
import { HintIcon } from '@/components/HintIcon';
import { colors } from '@/theme';

interface ToastState {
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

function rowCard(label: string, value: string, hint: boolean, equationKey?: EquationKey) {
  return (
    <View key={label} style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <View style={styles.specValueWrap}>
        <Text style={styles.specValue}>{value}</Text>
        {hint && equationKey ? <HintIcon equationKey={equationKey} /> : null}
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const result = useCalculatorStore((s) => s.result);
  const saveSession = useCalculatorStore((s) => s.saveSession);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
  }, []);

  const handleSaveSession = useCallback(() => {
    try {
      saveSession();
      showToast(t.messages.sessionSaved, 'success');
    } catch {
      showToast(t.messages.sessionSaveError, 'error');
    }
  }, [saveSession, t, showToast]);

  const handleGenerateReport = useCallback(async () => {
    if (!result) return;
    try {
      const text = buildReportText(result, t);
      const file = new FileSystem.File(
        FileSystem.Paths.cache,
        `solar-report-${Date.now()}.txt`,
      );
      file.create();
      file.write(text, { encoding: 'utf8' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        showToast(t.messages.exportDone, 'success');
      }
    } catch {
      showToast(t.messages.exportError, 'error');
    }
  }, [result, t, showToast]);

  const handlePrint = useCallback(async () => {
    if (!result) return;
    try {
      const text = buildReportText(result, t);
      const html = `
        <html dir="${dir}" style="font-family: sans-serif;">
          <body style="padding: 24px;">
            <pre style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${text}</pre>
          </body>
        </html>`;
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          showToast(t.messages.exportDone, 'success');
        }
      }
    } catch {
      showToast(t.messages.exportError, 'error');
    }
  }, [result, t, dir, showToast]);

  const toastColor = useMemo(() => {
    switch (toast?.type) {
      case 'error':
        return colors.danger;
      case 'warning':
        return '#856404';
      case 'success':
        return colors.primary;
      default:
        return colors.info;
    }
  }, [toast]);

  if (!result) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>{t.messages.exportFirst}</Text>
        <Button mode="contained" onPress={() => router.back()}>
          {t.btnCalculate}
        </Button>
      </View>
    );
  }

  const { inverter, battery, solar, currents } = result;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.headerTitle}>{t.resultsTitle}</Text>
            <Text style={styles.headerMeta}>
              {`${t.reportInputMethod} ${
                result.mode === 'detailed'
                  ? t.modeDetailedName
                  : result.mode === 'monthly'
                    ? t.modeMonthlyName
                    : t.modeRooftopName
              } • ${t.reportSystemVoltage} ${inverter.systemVoltage}V`}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{result.energy}</Text>
                <Text style={styles.statLabel}>{t.statKwhDay}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{result.peakPower}</Text>
                <Text style={styles.statLabel}>{t.statPeak}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{result.surgePower}</Text>
                <Text style={styles.statLabel}>{t.statSurge}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{result.autonomy}</Text>
                <Text style={styles.statLabel}>{t.statAutonomy}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.distributionTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.chartRow}>
              <View style={styles.chartTextWrap}>
                <Text style={styles.chartLine}>
                  {`${t.chartDay} ${result.energyDay} ${t.statKwhDay}`}
                </Text>
                <Text style={styles.chartLine}>
                  {`${t.chartNight} ${result.energyNight} ${t.statKwhDay}`}
                </Text>
                <Text style={styles.chartRatio}>
                  {`${t.dayNightRatio} ${result.dayPercentage}% / ${result.nightPercentage}%`}
                </Text>
              </View>
              <View style={styles.chartFlex}>
                <DistributionChart
                  dayPercent={result.dayPercentage}
                  nightPercent={result.nightPercentage}
                />
              </View>
            </View>
            <Text style={styles.note}>{t.distributionNote}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.inverterTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text style={styles.sectionLabel}>{t.specsTitle}</Text>
            {rowCard(t.systemVoltage, `${inverter.systemVoltage} V`, true, 'voltageGuide')}
            {rowCard(t.continuousPower, `${inverter.continuousPower} W`, true, 'inverter')}
            {rowCard(t.peakPowerCap, `${inverter.surgePower} W`, true, 'inverter')}
            {rowCard(t.efficiency, `${inverter.efficiency}%`, true, 'inverter')}
            {rowCard(
              t.phase,
              inverter.phase === 'three' ? t.phaseThree : t.phaseSingle,
              false,
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.batteryTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            {rowCard(t.batteryType, battery.type, false)}
            {rowCard(
              t.batteryCapacity,
              `${battery.kwh} kWh (${battery.ah} ${t.batteryAh})`,
              true,
              'batterySeparate',
            )}
            {rowCard(t.dodValue, `${battery.dod}%`, false)}
            {rowCard(t.nightEnergy, `${battery.energyNight} kWh`, false)}
            {rowCard(t.dayEnergy, `${battery.energyDay} kWh`, false)}
            {rowCard(t.autonomyDays, `${battery.autonomy} ${t.statAutonomy}`, true, 'autonomy')}
            {rowCard(t.chargeCycles, battery.cycles, false)}
            {rowCard(t.backupDaysValue, String(result.backupDaysCount), false)}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.solarTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            {rowCard(
              t.solarCount,
              `${solar.count} ${t.solarCountSuffix} ${solar.panelWattage} W`,
              true,
              'solarPanels',
            )}
            {rowCard(t.solarType, solar.type, false)}
            {rowCard(t.solarEfficiency, solar.efficiency, false)}
            {rowCard(t.solarStrings, String(solar.strings), false)}
            {rowCard(
              t.solarPanelsPerString,
              `${solar.panelsPerString} ${t.solarPanelsPerString}`,
              false,
            )}
            {rowCard(t.solarStringVoltage, `${solar.stringVoltage} V`, false)}
            {rowCard(t.systemVoltage, `${inverter.systemVoltage} V`, false)}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.calcDetailsTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            {result.details.map((row) => (
              <View key={row.label}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Text style={styles.detailLabel}>
                      {row.label} {row.equationKey ? <HintIcon equationKey={row.equationKey} /> : null}
                    </Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                    <Text style={styles.detailExplanation}>{row.explanation}</Text>
                  </View>
                </View>
                <Divider style={styles.divider} />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.currentsTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thType]}>{t.colCurrentType}</Text>
              <Text style={[styles.th, styles.thValue]}>{t.colCurrentValue}</Text>
              <Text style={[styles.th, styles.thCable]}>{t.colCableSize}</Text>
              <Text style={[styles.th, styles.thBreaker]}>{t.colBreaker}</Text>
            </View>
            {result.currentRows.map((row) => (
              <View key={row.label}>
                <View style={styles.tableRow}>
                  <Text style={[styles.td, styles.thType]}>
                    {row.label} <HintIcon equationKey={row.equationKey} />
                  </Text>
                  <Text style={[styles.td, styles.thValue]}>{row.value}</Text>
                  <Text style={[styles.td, styles.thCable]}>{row.cable}</Text>
                  <Text style={[styles.td, styles.thBreaker]}>{row.breaker}</Text>
                </View>
                <Divider style={styles.divider} />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.tipsTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text style={styles.sectionLabel}>{t.tipsInstallTitle}</Text>
            <Text style={styles.tip}>{`${t.tipVoltage} ${inverter.systemVoltage}V`}</Text>
            <Text style={styles.tip}>{t.tipOrientation}</Text>
            <Text style={styles.tip}>{t.tipTilt}</Text>
            <Text style={styles.tip}>{`${t.tipBatteryCables} ${currents.cableBattery}`}</Text>
            <Text style={styles.tip}>{`${t.tipSolarCables} ${currents.cableSolar}`}</Text>

            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>{t.tipsMaintainTitle}</Text>
            <Text style={styles.tip}>{t.tipClean}</Text>
            <Text style={styles.tip}>{t.tipConnections}</Text>
            <Text style={styles.tip}>{t.tipMonitor}</Text>
            <Text style={styles.tip}>{t.tipBatteryMaintenance}</Text>
            <Text style={styles.tip}>{t.tipReports}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.noteCard}>
          <Card.Content>
            <Text style={styles.note}>{t.importantNote}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              icon="content-save"
              onPress={handleSaveSession}
              style={styles.actionBtn}
              labelStyle={styles.actionLabel}
            >
              {t.btnSaveSession}
            </Button>
            <Button
              mode="contained"
              icon="file-document"
              onPress={handleGenerateReport}
              style={[styles.actionBtn, styles.secondaryAction]}
              labelStyle={styles.actionLabel}
            >
              {t.btnGenerateReport}
            </Button>
            <Button
              mode="outlined"
              icon="printer"
              onPress={handlePrint}
              style={styles.actionBtn}
            >
              {t.btnPrint}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={4000}
        style={toast ? { backgroundColor: toastColor } : undefined}
        action={{ label: t.messages.ok, onPress: () => setToast(null) }}
      >
        {toast?.message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: colors.bg,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: colors.primary,
    marginBottom: 14,
    borderRadius: 15,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerMeta: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    marginBottom: 14,
    backgroundColor: colors.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartTextWrap: {
    flex: 1,
  },
  chartFlex: {
    flex: 1,
  },
  chartLine: {
    fontSize: 13,
    color: colors.text,
  },
  chartRatio: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 6,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  specLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  specValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailRow: {
    paddingVertical: 8,
  },
  detailLeft: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detailExplanation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    marginVertical: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  th: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  td: {
    fontSize: 13,
    color: colors.text,
  },
  thType: {
    flex: 2.2,
  },
  thValue: {
    flex: 1.2,
    textAlign: 'center',
  },
  thCable: {
    flex: 1.3,
    textAlign: 'center',
  },
  thBreaker: {
    flex: 1.3,
    textAlign: 'center',
  },
  tip: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  noteCard: {
    marginBottom: 14,
    backgroundColor: colors.warningBg,
  },
  actionBtn: {
    borderRadius: 8,
    marginVertical: 4,
  },
  actionLabel: {
    fontSize: 15,
  },
  secondaryAction: {
    backgroundColor: colors.info,
  },
});
