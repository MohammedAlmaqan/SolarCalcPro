import { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Text, Button, Snackbar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCalculatorStore } from '@/store/calculatorStore';
import { calculateSystem } from '@/core/calculator';
import { validateAllInputs } from '@/core/validate';
import { makeLabels } from '@/core/makeLabels';
import type { SystemInput } from '@/core/types';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsSection } from '@/components/SettingsSection';
import { MonthlySection } from '@/components/MonthlySection';
import { RooftopSection } from '@/components/RooftopSection';
import { ApplianceRow } from '@/components/ApplianceRow';
import { NumberField } from '@/components/NumberField';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HintIcon } from '@/components/HintIcon';
import { colors } from '@/theme';

interface ToastState {
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

export default function CalculatorScreen() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const mode = useCalculatorStore((s) => s.mode);  const settings = useCalculatorStore((s) => s.settings);
  const monthly = useCalculatorStore((s) => s.monthly);
  const rooftop = useCalculatorStore((s) => s.rooftop);
  const appliances = useCalculatorStore((s) => s.appliances);
  const result = useCalculatorStore((s) => s.result);

  const setMode = useCalculatorStore((s) => s.setMode);
  const updateSettings = useCalculatorStore((s) => s.updateSettings);
  const updateMonthly = useCalculatorStore((s) => s.updateMonthly);
  const updateRooftop = useCalculatorStore((s) => s.updateRooftop);
  const addAppliance = useCalculatorStore((s) => s.addAppliance);
  const updateAppliance = useCalculatorStore((s) => s.updateAppliance);
  const removeAppliance = useCalculatorStore((s) => s.removeAppliance);
  const loadSamples = useCalculatorStore((s) => s.loadSamples);
  const setResult = useCalculatorStore((s) => s.setResult);
  const resetAll = useCalculatorStore((s) => s.resetAll);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
  }, []);

  const buildInput = useCallback(
    (): SystemInput => ({
      mode,
      appliances,
      settings,
      monthly,
      rooftop,
    }),
    [mode, appliances, settings, monthly, rooftop],
  );

  const handleCalculate = useCallback(() => {
    const input = buildInput();
    const { errors, warnings } = validateAllInputs(input, t);

    if (errors.length > 0) {
      showToast(`${t.validation.errorsCount} ${errors.length}: ${errors[0]}`, 'error');
      return;
    }

    warnings.forEach((warning) => showToast(warning, 'warning'));

    try {
      const labels = makeLabels(t);
      const result = calculateSystem(input, labels);
      setResult(result);
      router.push('/results');
      showToast(t.messages.calculated, 'success');
    } catch {
      showToast(t.messages.calculateError, 'error');
    }
  }, [buildInput, t, showToast, setResult, router]);

  const handleReset = useCallback(() => {
    Alert.alert(t.messages.resetConfirm, undefined, [
      { text: t.messages.cancel, style: 'cancel' },
      {
        text: t.messages.ok,
        style: 'destructive',
        onPress: () => {
          resetAll();
          showToast(t.messages.resetDone, 'success');
        },
      },
    ]);
  }, [t, resetAll, showToast]);

  const handleExport = useCallback(() => {
    if (!result) {
      showToast(t.messages.exportFirst, 'warning');
      return;
    }
    router.push('/results');
  }, [result, router, showToast, t]);

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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.bg }}
      >
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>{t.appTitle}</Text>
              <IconButton
                icon="translate"
                size={22}
                iconColor="#ffffff"
                style={styles.headerIcon}
              />
            </View>
            <Text style={styles.headerSubtitle}>{t.appSubtitle}</Text>
            <LanguageToggle />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <ModeSelector mode={mode} onChange={setMode} />
        </Card>

        {mode === 'detailed' ? (
          <Card style={styles.card}>
            <Card.Title title={t.detailedTitle} titleStyle={styles.cardTitle} />
            <Card.Content>
              <Text style={styles.subtitle}>{t.detailedSubtitle}</Text>

              {appliances.map((app, index) => (
                <ApplianceRow
                  key={app.id}
                  index={index + 1}
                  appliance={app}
                  onChange={(patch) => updateAppliance(app.id, patch)}
                  onRemove={() => removeAppliance(app.id)}
                />
              ))}

              <View style={styles.actionsRow}>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => addAppliance()}
                  style={styles.actionBtn}
                >
                  {t.addAppliance}
                </Button>
                <Button
                  mode="outlined"
                  icon="clipboard-list"
                  onPress={loadSamples}
                  style={styles.actionBtn}
                >
                  {t.loadSamples}
                </Button>
              </View>

              <View style={styles.lossRow}>
                <View style={styles.lossField}>
                  <NumberField
                    label={t.systemLossLabel}
                    value={settings.systemLoss}
                    onValueChange={(systemLoss) => updateSettings({ systemLoss })}
                  />
                </View>
              </View>

              <View style={styles.note}>
                <Text style={[styles.noteText, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
                  {t.detailedNote} <HintIcon equationKey="surgePower" />
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {mode === 'monthly' ? <MonthlySection monthly={monthly} onChange={updateMonthly} /> : null}

        {mode === 'rooftop' ? <RooftopSection rooftop={rooftop} onChange={updateRooftop} /> : null}

        <SettingsSection settings={settings} onChange={updateSettings} />

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              icon="calculator"
              onPress={handleCalculate}
              style={styles.calculateBtn}
              labelStyle={styles.calculateLabel}
            >
              {t.btnCalculate}
            </Button>

            <View style={styles.secondaryRow}>
              <Button mode="outlined" icon="refresh" onPress={handleReset} style={styles.secondaryBtn}>
                {t.resetCalculator}
              </Button>
              <Button mode="outlined" icon="export" onPress={handleExport} style={styles.secondaryBtn}>
                {t.btnExport}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title={t.techInfoTitle} titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text style={styles.techTitle}>{t.techVoltageTitle}</Text>
            <View style={styles.techList}>
              <Text style={styles.techItem}>{t.techVoltage12}</Text>
              <Text style={styles.techItem}>{t.techVoltage24}</Text>
              <Text style={styles.techItem}>{t.techVoltage48}</Text>
              <Text style={styles.techItem}>{t.techVoltage96}</Text>
            </View>
            <Text style={[styles.techTitle, { marginTop: 10 }]}>{t.techEfficiencyTitle}</Text>
            <View style={styles.techList}>
              <Text style={styles.techItem}>{t.techEfficiency1}</Text>
              <Text style={styles.techItem}>{t.techEfficiency2}</Text>
              <Text style={styles.techItem}>{t.techEfficiency3}</Text>
              <Text style={styles.techItem}>{t.techEfficiency4}</Text>
              <Text style={styles.techItem}>{t.techEfficiency5}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={4000}
        style={toast ? { backgroundColor: toastColor } : undefined}
        action={{
          label: t.messages.ok,
          onPress: () => setToast(null),
        }}
      >
        {toast?.message ?? ''}
      </Snackbar>
    </KeyboardAvoidingView>
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
  headerCard: {
    backgroundColor: colors.primary,
    marginBottom: 14,
    borderRadius: 15,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    margin: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  lossField: {
    flex: 1,
    maxWidth: 160,
  },
  note: {
    backgroundColor: colors.infoBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: colors.text,
  },
  calculateBtn: {
    borderRadius: 50,
    paddingVertical: 6,
    backgroundColor: colors.primary,
  },
  calculateLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    flex: 1,
  },
  techTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  techList: {
    marginTop: 6,
    gap: 4,
  },
  techItem: {
    fontSize: 13,
    color: colors.text,
  },
});
