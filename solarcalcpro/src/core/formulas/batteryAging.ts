/**
 * Battery aging model (study §5): cycle life vs depth-of-discharge tradeoff
 * and expected lifespan feeding the financial replacement schedule.
 *
 * Cycle life scales with DoD through a chemistry-specific exponent:
 *
 *   effectiveCycleLife = ratedCycles × (ratedDoD ÷ actualDoD)^k
 *
 * with k ≈ 1.15 for LiFePO₄, 1.3 for AGM/Gel and 1.5 for flooded lead-acid —
 * the accepted engineering approximation that deeper cycling wears a battery
 * out faster. All functions are pure.
 */

import type { BatteryChemistry } from '../types';

const DOD_EXPONENT: Record<BatteryChemistry, number> = {
  lifepo4: 1.15,
  'agm-gel': 1.3,
  flooded: 1.5,
};

export interface BatteryAgingOptions {
  /** Rated cycle life at the manufacturer's rated DoD. */
  ratedCycles: number;
  /** Rated depth of discharge (0–1) the cycle figure is quoted at. */
  ratedDoD: number;
  /** Actual design depth of discharge (0–1) from the battery sizing. */
  actualDoD: number;
  chemistry: BatteryChemistry;
  /** Usable battery storage at the system voltage (kWh). */
  batteryKwh: number;
  /** Daily energy cycled through the battery (kWh/day). */
  dailyCycledKwh: number;
  /** Analysis period (years) used for the replacement schedule, default 25. */
  systemLifeYears?: number;
}

export interface BatteryAgingResult {
  /** Cycle life adjusted for the actual DoD. */
  effectiveCycleLife: number;
  /** Full equivalent cycles per day. */
  cyclesPerDay: number;
  /** Expected battery lifespan (years); Infinity when the battery idles. */
  lifespanYears: number;
  /** Replacement years within the analysis period. */
  replacementYears: number[];
  /** Human-readable recommendation for the proposal / results UI. */
  recommendation: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Cycle life at a given DoD, scaled from the rated figure. */
export function cycleLifeAtDoD(
  ratedCycles: number,
  ratedDoD: number,
  actualDoD: number,
  chemistry: BatteryChemistry,
): number {
  if (ratedCycles <= 0) return 0;
  const rated = clamp(ratedDoD, 0.1, 1);
  const dod = clamp(actualDoD, 0.1, 1);
  const exponent = DOD_EXPONENT[chemistry] ?? 1.2;
  return Math.round(ratedCycles * Math.pow(rated / dod, exponent));
}

/** Expected lifespan in years for a given cycling rate. */
export function batteryLifespanYears(cyclesPerDay: number, effectiveCycleLife: number): number {
  if (effectiveCycleLife <= 0 || cyclesPerDay <= 0) return Number.POSITIVE_INFINITY;
  return effectiveCycleLife / (cyclesPerDay * 365);
}

/** Full battery-aging analysis for a design. */
export function batteryAgingAnalysis(options: BatteryAgingOptions): BatteryAgingResult {
  const {
    ratedCycles,
    ratedDoD,
    actualDoD,
    chemistry,
    batteryKwh,
    dailyCycledKwh,
    systemLifeYears = 25,
  } = options;

  const effectiveCycleLife = cycleLifeAtDoD(ratedCycles, ratedDoD, actualDoD, chemistry);
  const cyclesPerDay = batteryKwh > 0 ? (dailyCycledKwh / batteryKwh) * 1 : 0;
  const lifespanYears = batteryLifespanYears(cyclesPerDay, effectiveCycleLife);
  const life = Number.isFinite(lifespanYears) ? lifespanYears : 0;

  const replacementYears: number[] = [];
  if (life > 0) {
    for (let year = life; year <= systemLifeYears; year += life) {
      replacementYears.push(Math.round(year));
    }
  }

  let recommendation: string;
  if (!Number.isFinite(lifespanYears) || life >= systemLifeYears) {
    recommendation = `Battery outlasts the ${systemLifeYears}-year analysis at ${Math.round(actualDoD * 100)}% DoD (${effectiveCycleLife.toLocaleString()} cycles).`;
  } else {
    recommendation = `Battery reaches end of life after ~${Math.round(life)} years at ${Math.round(actualDoD * 100)}% DoD (${effectiveCycleLife.toLocaleString()} cycles) — plan a replacement${replacementYears.length > 0 ? ` in year ${replacementYears.join(', ')}` : ''}.`;
  }

  return {
    effectiveCycleLife,
    cyclesPerDay: Math.round(cyclesPerDay * 1000) / 1000,
    lifespanYears: Number.isFinite(lifespanYears) ? Math.round(lifespanYears * 10) / 10 : Number.POSITIVE_INFINITY,
    replacementYears,
    recommendation,
  };
}
