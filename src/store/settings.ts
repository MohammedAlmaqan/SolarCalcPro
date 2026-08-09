import { create } from 'zustand';

import { settingsRepo } from '../db/repos/settings';
import type { StandardsPolicy } from '../core/types';
import { getDbService } from './dbService';

export type ThemeMode = 'system' | 'light' | 'dark';
export type PowerUnit = 'w' | 'kw';
export type LengthUnit = 'm' | 'ft';
export type CableUnit = 'mm2' | 'awg';
export type TempUnit = 'c' | 'f';
export type WizardMode = 'wizard' | 'expert';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';

const THEME_KEY = 'ui.theme_mode';
const POWER_KEY = 'ui.units.power';
const LENGTH_KEY = 'ui.units.length';
const CABLE_KEY = 'ui.units.cable';
const TEMP_KEY = 'ui.units.temp';
const DEFAULT_PSH_KEY = 'ui.default_psh_location';
const WIZARD_KEY = 'ui.wizard_mode';
const STANDARDS_KEY = 'ui.standards_policy';
const ELECTRIC_RATE_KEY = 'ui.electric_rate';
const CURRENCY_KEY = 'ui.currency';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  AED: 'د.إ',
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: 'US Dollar ($)',
  EUR: 'Euro (€)',
  GBP: 'Pound (£)',
  SAR: 'Saudi Riyal (ر.س)',
  AED: 'UAE Dirham (د.إ)',
};

export interface UnitSettings {
  power: PowerUnit;
  length: LengthUnit;
  cable: CableUnit;
  temp: TempUnit;
}

const DEFAULT_UNITS: UnitSettings = {
  power: 'w',
  length: 'm',
  cable: 'mm2',
  temp: 'c',
};

function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}

function isPowerUnit(v: string | null): v is PowerUnit {
  return v === 'w' || v === 'kw';
}

function isLengthUnit(v: string | null): v is LengthUnit {
  return v === 'm' || v === 'ft';
}

function isCableUnit(v: string | null): v is CableUnit {
  return v === 'mm2' || v === 'awg';
}

function isTempUnit(v: string | null): v is TempUnit {
  return v === 'c' || v === 'f';
}

function isWizardMode(v: string | null): v is WizardMode {
  return v === 'wizard' || v === 'expert';
}

function isStandardsPolicy(v: string | null): v is StandardsPolicy {
  return v === 'strict' || v === 'advisory' || v === 'off';
}

interface SettingsState {
  loaded: boolean;
  themeMode: ThemeMode;
  units: UnitSettings;
  defaultPshLocationId: string | null;
  wizardMode: WizardMode;
  standardsPolicy: StandardsPolicy;
  /** Grid electric rate used for payback estimates (currency/kWh). */
  electricRate: number;
  currency: CurrencyCode;

  load: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setUnits: (patch: Partial<UnitSettings>) => Promise<void>;
  setDefaultPshLocationId: (id: string | null) => Promise<void>;
  setWizardMode: (mode: WizardMode) => Promise<void>;
  setStandardsPolicy: (policy: StandardsPolicy) => Promise<void>;
  setElectricRate: (rate: number) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
}

function isCurrencyCode(v: string | null): v is CurrencyCode {
  return v === 'USD' || v === 'EUR' || v === 'GBP' || v === 'SAR' || v === 'AED';
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  themeMode: 'system',
  units: DEFAULT_UNITS,
  defaultPshLocationId: null,
  wizardMode: 'wizard',
  standardsPolicy: 'strict',
  electricRate: 0.15,
  currency: 'USD',

  load: async () => {
    const repo = settingsRepo(getDbService());
    const [
      theme,
      power,
      length,
      cable,
      temp,
      defaultPsh,
      wizard,
      standards,
      electricRate,
      currency,
    ] = await Promise.all([
      repo.get(THEME_KEY),
      repo.get(POWER_KEY),
      repo.get(LENGTH_KEY),
      repo.get(CABLE_KEY),
      repo.get(TEMP_KEY),
      repo.get(DEFAULT_PSH_KEY),
      repo.get(WIZARD_KEY),
      repo.get(STANDARDS_KEY),
      repo.getNumber(ELECTRIC_RATE_KEY),
      repo.get(CURRENCY_KEY),
    ]);
    set({
      loaded: true,
      themeMode: isThemeMode(theme) ? theme : 'system',
      units: {
        power: isPowerUnit(power) ? power : DEFAULT_UNITS.power,
        length: isLengthUnit(length) ? length : DEFAULT_UNITS.length,
        cable: isCableUnit(cable) ? cable : DEFAULT_UNITS.cable,
        temp: isTempUnit(temp) ? temp : DEFAULT_UNITS.temp,
      },
      defaultPshLocationId: defaultPsh ?? null,
      wizardMode: isWizardMode(wizard) ? wizard : 'wizard',
      standardsPolicy: isStandardsPolicy(standards) ? standards : 'strict',
      electricRate: electricRate ?? 0.15,
      currency: isCurrencyCode(currency) ? currency : 'USD',
    });
  },

  setThemeMode: async (mode) => {
    await settingsRepo(getDbService()).set(THEME_KEY, mode);
    set({ themeMode: mode });
  },

  setUnits: async (patch) => {
    const repo = settingsRepo(getDbService());
    const next = { ...get().units, ...patch };
    const writes: Promise<void>[] = [];
    if (patch.power) writes.push(repo.set(POWER_KEY, patch.power));
    if (patch.length) writes.push(repo.set(LENGTH_KEY, patch.length));
    if (patch.cable) writes.push(repo.set(CABLE_KEY, patch.cable));
    if (patch.temp) writes.push(repo.set(TEMP_KEY, patch.temp));
    await Promise.all(writes);
    set({ units: next });
  },

  setDefaultPshLocationId: async (id) => {
    const repo = settingsRepo(getDbService());
    if (id) await repo.set(DEFAULT_PSH_KEY, id);
    else await repo.remove(DEFAULT_PSH_KEY);
    set({ defaultPshLocationId: id });
  },

  setWizardMode: async (mode) => {
    await settingsRepo(getDbService()).set(WIZARD_KEY, mode);
    set({ wizardMode: mode });
  },

  setStandardsPolicy: async (policy) => {
    await settingsRepo(getDbService()).set(STANDARDS_KEY, policy);
    set({ standardsPolicy: policy });
  },

  setElectricRate: async (rate) => {
    await settingsRepo(getDbService()).setNumber(ELECTRIC_RATE_KEY, rate);
    set({ electricRate: rate });
  },

  setCurrency: async (currency) => {
    await settingsRepo(getDbService()).set(CURRENCY_KEY, currency);
    set({ currency });
  },
}));
