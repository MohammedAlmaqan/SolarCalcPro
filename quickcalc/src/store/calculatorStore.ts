import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_MONTHLY,
  DEFAULT_ROOFTOP,
  DEFAULT_SETTINGS,
  SAMPLE_APPLIANCES,
} from '@/core/constants';
import type {
  Appliance,
  CalculationResult,
  InputMode,
  MonthlyData,
  RooftopData,
  Session,
  SessionData,
  SystemSettings,
} from '@/core/types';
import type { Lang } from '@/i18n/strings';
import { SAMPLE_APPLIANCE_NAMES } from '@/i18n/dictionaries';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createSampleAppliances(lang: Lang = 'ar'): Appliance[] {
  const names = SAMPLE_APPLIANCE_NAMES[lang];
  return SAMPLE_APPLIANCES.map((sample, index) => ({
    ...sample,
    name: names[index] ?? sample.name,
    id: makeId(),
  }));
}

export function createAppliance(
  partial?: Partial<Omit<Appliance, 'id'>>,
): Appliance {
  return {
    id: makeId(),
    name: '',
    power: 0,
    quantity: 1,
    dayHours: 0,
    nightHours: 0,
    type: 'electronics',
    ...partial,
  };
}

function sessionName(date: Date, lang: Lang): string {
  const formatted = date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB');
  const base = lang === 'ar' ? 'حساب' : 'Calculation';
  return `${base} ${formatted}`;
}

interface CalculatorState {
  lang: Lang;
  mode: InputMode;
  settings: SystemSettings;
  monthly: MonthlyData;
  rooftop: RooftopData;
  appliances: Appliance[];
  result: CalculationResult | null;
  sessions: Session[];

  setLang: (lang: Lang) => void;
  setMode: (mode: InputMode) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  updateMonthly: (patch: Partial<MonthlyData>) => void;
  updateRooftop: (patch: Partial<RooftopData>) => void;
  addAppliance: (partial?: Partial<Omit<Appliance, 'id'>>) => void;
  updateAppliance: (id: string, patch: Partial<Omit<Appliance, 'id'>>) => void;
  removeAppliance: (id: string) => void;
  loadSamples: () => void;
  clearAppliances: () => void;
  setResult: (result: CalculationResult | null) => void;
  saveSession: () => void;
  restoreSession: (id: number) => boolean;
  deleteSession: (id: number) => void;
  resetAll: () => void;
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      mode: 'detailed',
      settings: { ...DEFAULT_SETTINGS },
      monthly: { ...DEFAULT_MONTHLY },
      rooftop: { ...DEFAULT_ROOFTOP },
      appliances: createSampleAppliances(),
      result: null,
      sessions: [],

      setLang: (lang) => set({ lang }),

      setMode: (mode) => set({ mode }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      updateMonthly: (patch) =>
        set((state) => ({ monthly: { ...state.monthly, ...patch } })),

      updateRooftop: (patch) =>
        set((state) => ({ rooftop: { ...state.rooftop, ...patch } })),

      addAppliance: (partial) =>
        set((state) => ({
          appliances: [...state.appliances, createAppliance(partial)],
        })),

      updateAppliance: (id, patch) =>
        set((state) => ({
          appliances: state.appliances.map((app) =>
            app.id === id ? { ...app, ...patch } : app,
          ),
        })),

      removeAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.filter((app) => app.id !== id),
        })),

      loadSamples: () => set({ appliances: createSampleAppliances(get().lang) }),

      clearAppliances: () => set({ appliances: [] }),

      setResult: (result) => set({ result }),

      saveSession: () => {
        const state = get();
        const now = new Date();
        const data: SessionData = {
          mode: state.mode,
          settings: { ...state.settings },
          appliances: state.appliances.map((app) => ({ ...app })),
          monthly: state.monthly ? { ...state.monthly } : undefined,
          rooftop: state.rooftop ? { ...state.rooftop } : undefined,
        };
        const session: Session = {
          id: now.getTime(),
          name: sessionName(now, state.lang),
          data,
        };
        const sessions = [...state.sessions, session];
        if (sessions.length > 10) sessions.shift();
        set({ sessions });
      },

      restoreSession: (id) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === id);
        if (!session) return false;
        set({
          mode: session.data.mode,
          settings: { ...DEFAULT_SETTINGS, ...session.data.settings },
          appliances: session.data.appliances.map((app) => ({ ...app })),
          monthly: session.data.monthly
            ? { ...DEFAULT_MONTHLY, ...session.data.monthly }
            : { ...DEFAULT_MONTHLY },
          rooftop: session.data.rooftop
            ? { ...DEFAULT_ROOFTOP, ...session.data.rooftop }
            : { ...DEFAULT_ROOFTOP },
        });
        return true;
      },

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      resetAll: () =>
        set({
          mode: 'detailed',
          settings: { ...DEFAULT_SETTINGS },
          monthly: { ...DEFAULT_MONTHLY },
          rooftop: { ...DEFAULT_ROOFTOP },
          appliances: createSampleAppliances(),
          result: null,
        }),
    }),
    {
      name: 'solar-calc-web-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lang: state.lang,
        settings: state.settings,
        sessions: state.sessions,
      }),
    },
  ),
);
