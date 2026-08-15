import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { ar, en } from '@/i18n/strings';
import type { AppStrings, Lang } from '@/i18n/strings';
import { DEVICE_TYPE_NAMES, SOLAR_PANEL_TYPE_NAMES } from '@/i18n/dictionaries';
import {
  EQUATION_CATEGORIES,
  EQUATIONS_AR,
  EQUATIONS_EN,
} from '@/core/equations';
import type { EquationDefinition, EquationKey } from '@/core/equations';
import type { DeviceTypeId } from '@/core/types';
import { useCalculatorStore } from '@/store/calculatorStore';

export type EquationCategory = { id: string; label: string; keys: EquationKey[] };

interface LanguageContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  t: AppStrings;
  equations: Record<EquationKey, EquationDefinition>;
  categories: EquationCategory[];
  deviceTypeNames: Record<DeviceTypeId, string>;
  solarPanelTypeName: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useCalculatorStore((s) => s.lang);
  const setLang = useCalculatorStore((s) => s.setLang);

  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(lang === 'ar');
  }, [lang]);

  const changeLang = useCallback(
    (next: Lang) => {
      setLang(next);
    },
    [setLang],
  );

  const value = useMemo<LanguageContextValue>(() => {
    const dict = lang === 'ar' ? ar : en;
    const equations = lang === 'ar' ? EQUATIONS_AR : EQUATIONS_EN;
    const categoryLabels: Record<string, string> = {
      energy: dict.categoryEnergy,
      components: dict.categoryComponents,
      currents: dict.categoryCurrents,
      efficiency: dict.categoryEfficiency,
    };
    const categories: EquationCategory[] = EQUATION_CATEGORIES.map((cat) => ({
      id: cat.id,
      label: categoryLabels[cat.id] ?? cat.id,
      keys: cat.keys,
    }));
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang: changeLang,
      t: dict,
      equations,
      categories,
      deviceTypeNames: DEVICE_TYPE_NAMES[lang],
      solarPanelTypeName: SOLAR_PANEL_TYPE_NAMES[lang].label,
    };
  }, [lang, changeLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
