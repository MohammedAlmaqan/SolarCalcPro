import { Dialog, Portal, Text, Button, Divider } from 'react-native-paper';
import { ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useUiStore } from '@/store/uiStore';
import { colors } from '@/theme';

export function GlobalEquationDialog() {
  const equation = useUiStore((s) => s.equation);
  const closeEquation = useUiStore((s) => s.closeEquation);
  const { t, equations, dir } = useLanguage();

  const visible = equation !== null;
  const eq = equation ? equations[equation.key] : null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={closeEquation} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{eq ? `🧮 ${eq.title}` : ''}</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.scroll}>
            {eq ? (
              <>
                <Text style={styles.formula} selectable>
                  {eq.formula}
                </Text>

                {equation?.actualValue ? (
                  <Text style={styles.actual}>{`${t.yourValueLabel} ${equation.actualValue}`}</Text>
                ) : null}

                <Divider style={styles.divider} />

                {eq.variables.length > 0 ? (
                  <Text style={styles.sectionLabel}>{t.variablesLabel}</Text>
                ) : null}
                {eq.variables.map((v, i) => (
                  <Text key={i} style={styles.bullet}>
                    {v}
                  </Text>
                ))}

                <Text style={[styles.example, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}>
                  {`${t.exampleLabel} ${eq.example}`}
                </Text>
              </>
            ) : null}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="contained" onPress={closeEquation}>
            {t.gotIt}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '92%',
  },
  title: {
    fontSize: 16,
    color: colors.info,
  },
  scroll: {
    maxHeight: 380,
  },
  formula: {
    fontFamily: 'monospace',
    fontSize: 15,
    backgroundColor: colors.statsBg,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
  },
  actual: {
    fontSize: 14,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  example: {
    fontSize: 13,
    color: colors.info,
    backgroundColor: colors.infoBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
});
