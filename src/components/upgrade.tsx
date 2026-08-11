import { createContext, useContext, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import {
  FEATURE_BY_KEY,
  FEATURE_REGISTRY,
  hasFeature,
  type FeatureKey,
} from '../core/capabilities';
import { useSettingsStore } from '../store/settings';

interface UpgradeContextValue {
  showUpgrade: (feature?: FeatureKey) => void;
}

const UpgradeContext = createContext<UpgradeContextValue>({
  showUpgrade: () => {},
});

/** Global Pro upgrade dialog provider. Mount once in the root layout. */
export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [feature, setFeature] = useState<FeatureKey | undefined>(undefined);
  const [openCount, setOpenCount] = useState(0);

  const showUpgrade = (f?: FeatureKey) => {
    setFeature(f);
    setOpenCount((c) => c + 1);
    setVisible(true);
  };

  return (
    <UpgradeContext.Provider value={{ showUpgrade }}>
      {children}
      <UpgradeDialog
        key={openCount}
        visible={visible}
        onDismiss={() => setVisible(false)}
        feature={feature}
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade(): UpgradeContextValue {
  return useContext(UpgradeContext);
}

export function UpgradeDialog({
  visible,
  onDismiss,
  feature,
}: {
  visible: boolean;
  onDismiss: () => void;
  feature?: FeatureKey;
}) {
  const theme = useTheme();
  const tier = useSettingsStore((s) => s.tier);
  const unlockPro = useSettingsStore((s) => s.unlockPro);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isPro = tier === 'pro';
  const highlight = feature ? FEATURE_BY_KEY[feature] : undefined;

  const submit = async () => {
    setBusy(true);
    setError('');
    const ok = await unlockPro(key);
    setBusy(false);
    if (ok) setKey('');
    else setError('That license key is not valid. Check the format and try again.');
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {isPro ? 'SlorCalcPro is active' : 'Upgrade to SlorCalcPro'}
      </Dialog.Title>
      <Dialog.Content>
        {highlight ? (
          <Card mode="outlined" style={styles.highlightCard}>
            <Card.Content>
              <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                {highlight.label}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {highlight.description}
              </Text>
            </Card.Content>
          </Card>
        ) : null}
        {isPro ? (
          <Text variant="bodyMedium">
            All Pro features are unlocked on this device. Thank you for supporting SlorCalcPro.
          </Text>
        ) : (
          <>
            <Text variant="bodyMedium">
              Enter your license key to unlock Pro on this device. It is stored locally and works
              fully offline.
            </Text>
            <TextInput
              mode="outlined"
              label="License key"
              value={key}
              onChangeText={setKey}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            {error ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {error}
              </Text>
            ) : null}
            <Button
              mode="contained"
              icon="crown-outline"
              loading={busy}
              disabled={busy || !key.trim()}
              onPress={submit}
              style={styles.unlockButton}
            >
              Unlock Pro
            </Button>
            <Divider style={styles.divider} />
            <Text variant="labelLarge">Pro features</Text>
            <ScrollView style={styles.featureList}>
              {FEATURE_REGISTRY.filter((f) => f.tier === 'pro').map((f) => (
                <List.Item
                  key={f.key}
                  title={f.label}
                  description={f.description}
                  descriptionNumberOfLines={2}
                  left={() => <List.Icon icon="check-decagram-outline" color={theme.colors.primary} />}
                />
              ))}
            </ScrollView>
          </>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Close</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

/**
 * Render children only if the current tier includes `feature`; otherwise show a
 * locked card that prompts the upgrade dialog.
 */
export function ProGate({ feature, children }: { feature: FeatureKey; children: ReactNode }) {
  const theme = useTheme();
  const tier = useSettingsStore((s) => s.tier);
  const { showUpgrade } = useUpgrade();

  if (hasFeature(tier, feature)) return <>{children}</>;

  const def = FEATURE_BY_KEY[feature];
  return (
    <Card mode="outlined" style={styles.lockedCard}>
      <Card.Content style={styles.lockedRow}>
        <List.Icon icon="lock-outline" color={theme.colors.primary} />
        <View style={styles.lockedText}>
          <Text variant="titleSmall">{def.label} is a Pro feature</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {def.description}
          </Text>
        </View>
        <Button mode="contained-tonal" icon="crown-outline" onPress={() => showUpgrade(feature)}>
          Upgrade
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  highlightCard: {
    marginBottom: 12,
  },
  input: {
    marginTop: 12,
    marginBottom: 8,
  },
  unlockButton: {
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  featureList: {
    maxHeight: 220,
    marginTop: 4,
  },
  lockedCard: {
    marginVertical: 8,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockedText: {
    flex: 1,
    gap: 2,
  },
});
