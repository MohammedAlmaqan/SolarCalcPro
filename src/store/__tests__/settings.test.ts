import { MASTER_LICENSE_KEY, generateLicenseKey } from '../../core/capabilities';
import { settingsRepo } from '../../db/repos/settings';
import { setDbService, getDbService } from '../dbService';
import { useSettingsStore } from '../settings';
import { openTestDb } from '../../db/__tests__/helpers/testDb';

function db() {
  return getDbService();
}

describe('useSettingsStore — entitlement tier', () => {
  beforeEach(async () => {
    const db = await openTestDb();
    setDbService(db);
    useSettingsStore.setState({
      loaded: false,
      themeMode: 'system',
      units: { power: 'w', length: 'm', cable: 'mm2', temp: 'c' },
      defaultPshLocationId: null,
      wizardMode: 'wizard',
      standardsPolicy: 'strict',
      electricRate: 0.15,
      discountRate: 0.05,
      systemLifeYears: 25,
      tariffEscalationRate: 0.02,
      currency: 'USD',
      companyProfile: {
        companyName: 'SlorCalcPro',
        tagline: '',
        engineerName: '',
        phone: '',
        email: '',
        address: '',
        logoDataUri: '',
        signatureSvg: '',
      },
      tier: 'free',
    });
  });

  it('defaults to the free tier', async () => {
    await useSettingsStore.getState().load();
    expect(useSettingsStore.getState().tier).toBe('free');
  });

  it('unlocks Pro with a valid license key and persists it', async () => {
    await useSettingsStore.getState().load();
    expect(await useSettingsStore.getState().unlockPro(MASTER_LICENSE_KEY)).toBe(true);
    expect(useSettingsStore.getState().tier).toBe('pro');

    const persisted = await settingsRepo(db()).get('app.entitlement');
    expect(persisted).toBe('pro');

    // A reload restores the pro tier from storage.
    useSettingsStore.setState({ tier: 'free' });
    await useSettingsStore.getState().load();
    expect(useSettingsStore.getState().tier).toBe('pro');
  });

  it('accepts any correctly-signed key', async () => {
    await useSettingsStore.getState().load();
    expect(await useSettingsStore.getState().unlockPro(generateLicenseKey())).toBe(true);
    expect(useSettingsStore.getState().tier).toBe('pro');
  });

  it('rejects an invalid key without changing the tier', async () => {
    await useSettingsStore.getState().load();
    expect(await useSettingsStore.getState().unlockPro('INVALID-KEY-0000')).toBe(false);
    expect(useSettingsStore.getState().tier).toBe('free');
    const persisted = await settingsRepo(db()).get('app.entitlement');
    expect(persisted).toBeNull();
  });
});

