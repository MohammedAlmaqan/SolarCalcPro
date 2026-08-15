import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { SegmentedField, NumberField } from '@/components/form';
import { PshPicker } from '@/components/pickers';
import { SignaturePad } from '@/components/SignaturePad';
import { ProGate, useUpgrade } from '@/components/upgrade';
import { FEATURE_REGISTRY } from '@/core/capabilities';
import { COMPANY_LOGO_DATA_URI } from '@/reports/companyLogoDataUri';
import { SEED_MARKER_KEY } from '@/db';
import { settingsRepo } from '@/db/repos/settings';
import {
  exportDatabase,
  parseDatabaseBackup,
  restoreDatabase,
} from '@/db/backup';
import { getDbService } from '@/store/dbService';
import { useProjectStore } from '@/store/projects';
import { useReferenceStore } from '@/store/reference';
import {
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,
  type CurrencyCode,
  useSettingsStore,
} from '@/store/settings';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettingsStore();
  const psh = useReferenceStore((s) => s.psh);
  const refreshProjects = useProjectStore((s) => s.refresh);
  const loadReference = useReferenceStore((s) => s.load);
  const { showUpgrade } = useUpgrade();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [signatureDialog, setSignatureDialog] = useState(false);
  const [signatureSvg, setSignatureSvg] = useState('');
  const [signatureHasInk, setSignatureHasInk] = useState(false);

  const logoUri = settings.companyProfile.logoDataUri || COMPANY_LOGO_DATA_URI;

  const openSignatureDialog = () => {
    setSignatureSvg('');
    setSignatureHasInk(false);
    setSignatureDialog(true);
  };

  const saveSignature = async () => {
    await settings.setCompanyProfile({ signatureSvg });
    setSignatureDialog(false);
  };

  const notify = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const exportBackup = async () => {
    setBusy(true);
    try {
      const json = await exportDatabase(getDbService());
      const file = new File(Paths.cache, 'solarcalcpro-backup.json');
      file.create({ overwrite: true, intermediates: true });
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Share full database backup',
        });
      }
      notify('Full backup exported');
    } catch (e) {
      notify('Backup export failed');
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const pickRestore = async () => {
    setRestoreDialog(false);
    setBusy(true);
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
      if (picked.canceled || !picked.result) return;
      const parsed = parseDatabaseBackup(picked.result.textSync());
      await restoreDatabase(getDbService(), parsed);
      await settingsRepo(getDbService()).remove(SEED_MARKER_KEY);
      await settings.load();
      await refreshProjects();
      await loadReference();
      notify('Full backup restored');
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoreDialog(true);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const openRestoreDialog = () => {
    setRestoreError('');
    setRestoreDialog(true);
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [8, 5],
      quality: 0.9,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const dataUri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    await settings.setCompanyProfile({ logoDataUri: dataUri });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <View style={styles.container}>
        <Card mode="outlined">
          <Card.Title
            title={settings.tier === 'pro' ? 'SlorCalcPro — active' : 'SlorCalcPro'}
            titleVariant="titleMedium"
            right={() => (
              <List.Icon
                icon={settings.tier === 'pro' ? 'crown' : 'crown-outline'}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
          <Card.Content>
            {settings.tier === 'pro' ? (
              <Text variant="bodyMedium">
                Pro is unlocked on this device. All professional features are available.
              </Text>
            ) : (
              <>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  The free tier is fully functional for single-site designs. Pro unlocks client
                  branding, proposal PDFs, scenario comparison and unlimited projects.
                </Text>
                <Button
                  mode="contained"
                  icon="crown-outline"
                  onPress={() => showUpgrade()}
                  style={styles.upgradeButton}
                >
                  Unlock Pro
                </Button>
              </>
            )}
            <View style={styles.proFeatureTags}>
              {FEATURE_REGISTRY.filter((f) => f.tier === 'pro').map((f) => (
                <Text key={f.key} variant="labelSmall" style={styles.proFeatureTag}>
                  {f.label}
                </Text>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Appearance" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <SegmentedField
              label="Theme"
              value={settings.themeMode}
              onChange={(v) => settings.setThemeMode(v as 'system' | 'light' | 'dark')}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Units" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <SegmentedField
              label="Power"
              value={settings.units.power}
              onChange={(v) => settings.setUnits({ power: v as 'w' | 'kw' })}
              options={[
                { value: 'w', label: 'W' },
                { value: 'kw', label: 'kW' },
              ]}
            />
            <SegmentedField
              label="Length"
              value={settings.units.length}
              onChange={(v) => settings.setUnits({ length: v as 'm' | 'ft' })}
              options={[
                { value: 'm', label: 'm' },
                { value: 'ft', label: 'ft' },
              ]}
            />
            <SegmentedField
              label="Cable size"
              value={settings.units.cable}
              onChange={(v) => settings.setUnits({ cable: v as 'mm2' | 'awg' })}
              options={[
                { value: 'mm2', label: 'mm²' },
                { value: 'awg', label: 'AWG' },
              ]}
            />
            <SegmentedField
              label="Temperature"
              value={settings.units.temp}
              onChange={(v) => settings.setUnits({ temp: v as 'c' | 'f' })}
              options={[
                { value: 'c', label: '°C' },
                { value: 'f', label: '°F' },
              ]}
            />
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Design defaults" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <PshPicker
              locations={psh}
              selectedId={settings.defaultPshLocationId}
              onSelect={(location) => settings.setDefaultPshLocationId(location.id)}
              onClear={() => settings.setDefaultPshLocationId(null)}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pre-fills the location step of new designs.
            </Text>
          </Card.Content>
        </Card>

        <ProGate feature="companyBranding">
          <Card mode="outlined">
            <Card.Title title="Company profile" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Branding shown on proposal PDF exports.
            </Text>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
              </View>
              <View style={styles.logoActions}>
                <Button mode="contained-tonal" icon="image" onPress={pickLogo} compact>
                  Choose image
                </Button>
                {settings.companyProfile.logoDataUri ? (
                  <Button
                    mode="text"
                    icon="close-circle"
                    onPress={() => settings.setCompanyProfile({ logoDataUri: '' })}
                    compact
                  >
                    Reset to default
                  </Button>
                ) : null}
              </View>
            </View>
            <TextInput
              mode="outlined"
              label="Company name"
              value={settings.companyProfile.companyName}
              onChangeText={(v) => settings.setCompanyProfile({ companyName: v })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Tagline"
              value={settings.companyProfile.tagline}
              onChangeText={(v) => settings.setCompanyProfile({ tagline: v })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Engineer / prepared by"
              value={settings.companyProfile.engineerName}
              onChangeText={(v) => settings.setCompanyProfile({ engineerName: v })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Phone"
              value={settings.companyProfile.phone}
              onChangeText={(v) => settings.setCompanyProfile({ phone: v })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Email"
              value={settings.companyProfile.email}
              onChangeText={(v) => settings.setCompanyProfile({ email: v })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Address"
              value={settings.companyProfile.address}
              onChangeText={(v) => settings.setCompanyProfile({ address: v })}
              style={styles.input}
            />
            <ProGate feature="sitePhotos">
              <Divider style={styles.signatureDivider} />
              <Text variant="labelLarge">Electronic signature</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Signed onto the acceptance block of every proposal PDF.
              </Text>
              {settings.companyProfile.signatureSvg ? (
                <>
                  <View style={styles.signaturePreview}>
                    <SvgXml
                      xml={settings.companyProfile.signatureSvg}
                      width="100%"
                      height={72}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                  <View style={styles.signatureActions}>
                    <Button
                      mode="text"
                      icon="pencil-outline"
                      onPress={openSignatureDialog}
                      compact
                    >
                      Redraw
                    </Button>
                    <Button
                      mode="text"
                      icon="close-circle"
                      onPress={() => settings.setCompanyProfile({ signatureSvg: '' })}
                      compact
                    >
                      Clear
                    </Button>
                  </View>
                </>
              ) : (
                <Button
                  mode="contained-tonal"
                  icon="draw"
                  onPress={openSignatureDialog}
                  style={styles.signatureAddButton}
                >
                  Draw signature
                </Button>
              )}
            </ProGate>
          </Card.Content>
          </Card>
        </ProGate>

        <Card mode="outlined">
          <Card.Title title="Cost & payback" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <SegmentedField
              label="Currency"
              value={settings.currency}
              onChange={(v) => settings.setCurrency(v as CurrencyCode)}
              options={(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((code) => ({
                value: code,
                label: code,
              }))}
            />
            <NumberField
              label="Grid electric rate"
              value={settings.electricRate}
              onChange={(v) => settings.setElectricRate(v ?? 0)}
              unit={`${CURRENCY_SYMBOLS[settings.currency]}/kWh`}
              helperText="Used to estimate annual savings and the simple payback period."
              decimals={3}
              min={0}
              max={2}
            />
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Data & backup" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              A full backup includes every project, design, catalog entry and setting.
            </Text>
            <View style={styles.backupRow}>
              <Button
                mode="contained"
                icon="database-export-outline"
                loading={busy}
                disabled={busy}
                onPress={exportBackup}
              >
                Export full backup
              </Button>
              <Button
                mode="outlined"
                icon="database-import-outline"
                disabled={busy}
                onPress={openRestoreDialog}
              >
                Restore full backup
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Standards & compliance" titleVariant="titleMedium" />
          <Divider />
          <Card.Content>
            <SegmentedField
              label="Standards policy"
              value={settings.standardsPolicy}
              onChange={(v) => settings.setStandardsPolicy(v as 'strict' | 'advisory' | 'off')}
              options={[
                { value: 'strict', label: 'Strict' },
                { value: 'advisory', label: 'Advisory' },
                { value: 'off', label: 'Off' },
              ]}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Strict enforces international codes (NEC/IEC). Advisory keeps results usable when
              local-market components do not meet every code. Off hides standards checks. Safety
              checks (cable sizing) always remain.
            </Text>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <List.Item
            title="Engineering reference"
            description="NEC 690/705 & IEC 62548 formulas and conventions used by the engine"
            left={() => <List.Icon icon="book-open-variant" color={theme.colors.primary} />}
            onPress={() => router.push('/docs')}
          />
        </Card>
      </View>

      <Portal>
        <Dialog visible={restoreDialog} onDismiss={() => setRestoreDialog(false)}>
          <Dialog.Title>Restore full backup</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {restoreError
                ? restoreError
                : 'This replaces ALL current projects, designs, catalog entries and settings with the backup file. Continue?'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRestoreDialog(false)}>Cancel</Button>
            <Button
              onPress={pickRestore}
              icon="file-import-outline"
              loading={busy}
              disabled={busy}
            >
              Choose backup file
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={signatureDialog} onDismiss={() => setSignatureDialog(false)}>
          <Dialog.Title>Draw your signature</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Sign with your finger inside the box. The signature is stored on this device.
            </Text>
            <View style={styles.signaturePadWrap}>
              <SignaturePad
                onChange={(svg, hasInk) => {
                  setSignatureSvg(svg);
                  setSignatureHasInk(hasInk);
                }}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSignatureDialog(false)}>Cancel</Button>
            <Button disabled={!signatureHasInk} onPress={saveSignature}>
              Use signature
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoBox: {
    width: 88,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoActions: {
    flex: 1,
    gap: 4,
  },
  signatureDivider: {
    marginVertical: 14,
  },
  signaturePreview: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  signatureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  signatureAddButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  signaturePadWrap: {
    marginTop: 12,
  },
  backupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upgradeButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  proFeatureTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  proFeatureTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 79, 108, 0.1)',
    overflow: 'hidden',
  },
});
