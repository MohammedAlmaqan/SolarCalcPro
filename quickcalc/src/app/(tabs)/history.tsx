import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, IconButton, Divider, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCalculatorStore } from '@/store/calculatorStore';
import type { Session } from '@/core/types';
import { colors } from '@/theme';

interface ToastState {
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

function daysAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return String(Math.max(days, 0));
}

export default function HistoryScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const sessions = useCalculatorStore((s) => s.sessions);
  const restoreSession = useCalculatorStore((s) => s.restoreSession);
  const deleteSession = useCalculatorStore((s) => s.deleteSession);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
  }, []);

  const handleRestore = useCallback(
    (session: Session) => {
      const ok = restoreSession(session.id);
      if (!ok) {
        showToast(t.messages.sessionSaveError, 'error');
        return;
      }
      showToast(t.messages.sessionRestored, 'success');
      router.push('/');
    },
    [restoreSession, t, showToast, router],
  );

  const handleDelete = useCallback(
    (session: Session) => {
      Alert.alert(t.messages.confirmDelete, undefined, [
        { text: t.messages.cancel, style: 'cancel' },
        {
          text: t.messages.ok,
          style: 'destructive',
          onPress: () => {
            deleteSession(session.id);
            showToast(t.messages.sessionRestored, 'info');
          },
        },
      ]);
    },
    [deleteSession, t, showToast],
  );

  const toastColor =
    toast?.type === 'error'
      ? colors.danger
      : toast?.type === 'success'
        ? colors.primary
        : toast?.type === 'warning'
          ? '#856404'
          : colors.info;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.headerTitle}>{t.messages.historyTitle}</Text>
            <Text style={styles.headerSubtitle}>{t.messages.historySubtitle}</Text>
          </Card.Content>
        </Card>

        {sessions.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.empty}>{t.messages.sessionEmpty}</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            {sessions.map((session, index) => {
              const modeName =
                session.data.mode === 'detailed'
                  ? t.modeDetailedName
                  : session.data.mode === 'monthly'
                    ? t.modeMonthlyName
                    : t.modeRooftopName;
              return (
                <View key={session.id}>
                  {index > 0 ? <Divider style={styles.divider} /> : null}
                  <View style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>{session.name}</Text>
                      <Text style={styles.sessionMeta}>
                        {`${modeName} • ${session.data.settings.systemVoltage}V • ${t.messages.daysAgo}: ${daysAgo(new Date(session.id))}`}
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <IconButton
                        icon="restore"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => handleRestore(session)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={colors.danger}
                        onPress={() => handleDelete(session)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <Button
          mode="contained"
          icon="calculator"
          onPress={() => router.push('/')}
          style={styles.newCalcBtn}
        >
          {t.btnCalculate}
        </Button>
      </ScrollView>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={3000}
        style={{ backgroundColor: toastColor }}
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
  headerCard: {
    backgroundColor: colors.secondary,
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
  card: {
    backgroundColor: colors.card,
    marginBottom: 14,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  divider: {
    marginHorizontal: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newCalcBtn: {
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
});
