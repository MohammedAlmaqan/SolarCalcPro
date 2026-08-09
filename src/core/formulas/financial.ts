/**
 * Financial analysis for solar systems (study §5): simple & discounted
 * payback, NPV, LCOE and battery replacement scheduling.
 *
 * All functions are pure and currency-agnostic — amounts are passed in and
 * returned in the caller's currency.
 */

export interface FinancialOptions {
  /** Grid electric rate in year 1 (currency/kWh). */
  electricRate: number;
  /** Annual nominal discount rate (decimal), default 0.05. */
  discountRate?: number;
  /** Analysis period in years, default 25. */
  systemLifeYears?: number;
  /** Annual tariff escalation (decimal), default 0.02. */
  tariffEscalationRate?: number;
}

export interface BatteryReplacement {
  year: number;
  cost: number;
}

export interface FinancialAnalysis {
  /** Annual savings in year 1 (currency/yr). */
  annualSavings: number;
  /** Total / year-1 savings; null when the rate is zero. */
  simplePaybackYears: number | null;
  /** Discounted payback within the analysis period; null if never reached. */
  discountedPaybackYears: number | null;
  /** Net present value over the analysis period (currency). */
  netPresentValue: number;
  /** Levelized cost of energy (currency/kWh); null when no production. */
  lcoe: number | null;
  /** Total lifecycle cost including replacements (currency). */
  lifetimeCost: number;
  /** Total lifetime production (kWh). */
  lifetimeEnergyKwh: number;
  /** Estimated battery cycles per year; null when no battery is modeled. */
  annualBatteryCycles: number | null;
  /** Battery replacements by year, within the analysis period. */
  batteryReplacements: BatteryReplacement[];
  systemLifeYears: number;
  discountRate: number;
  tariffEscalationRate: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Discounted cash-flow model:
 *   Year 0: −total installed cost
 *   Years 1..N: +annual savings × (1 + escalation)^(y−1) − battery replacements
 *
 * NPV sums discounted cash flows; discounted payback interpolates the year
 * the cumulative discounted cash flow turns positive.
 */
export function analyzeFinancials(options: {
  totalCost: number;
  annualProductionKwh: number;
  electricRate: number;
  discountRate?: number;
  systemLifeYears?: number;
  tariffEscalationRate?: number;
  /** Usable battery storage in kWh; 0 when no battery. */
  batteryKwh?: number;
  /** Daily energy cycled through the battery (kWh/day). */
  dailyCycledKwh?: number;
  /** Battery cycle life at the design DoD. */
  batteryCycleLife?: number;
  /** Replacement cost of the battery bank (currency). */
  batteryReplacementCost?: number;
}): FinancialAnalysis {
  const {
    totalCost,
    annualProductionKwh,
    electricRate,
    batteryKwh = 0,
    dailyCycledKwh = 0,
    batteryCycleLife = 0,
    batteryReplacementCost = 0,
  } = options;

  const systemLifeYears = Math.round(clamp(options.systemLifeYears ?? 25, 1, 40));
  const discountRate = clamp(options.discountRate ?? 0.05, 0, 0.25);
  const tariffEscalationRate = clamp(options.tariffEscalationRate ?? 0.02, 0, 0.15);

  const annualSavings = annualProductionKwh * electricRate;
  const simplePaybackYears =
    annualSavings > 0 ? round2(totalCost / annualSavings) : null;

  // Battery replacement schedule — replace when cumulative cycles pass the
  // cycle life at the estimated daily cycling depth.
  let annualBatteryCycles: number | null = null;
  const batteryReplacements: BatteryReplacement[] = [];
  if (batteryKwh > 0 && dailyCycledKwh > 0 && batteryCycleLife > 0) {
    annualBatteryCycles = (dailyCycledKwh / batteryKwh) * 365;
    let cycleAccumulator = 0;
    for (let year = 1; year <= systemLifeYears; year += 1) {
      cycleAccumulator += annualBatteryCycles;
      if (cycleAccumulator >= batteryCycleLife) {
        batteryReplacements.push({ year, cost: round2(batteryReplacementCost) });
        cycleAccumulator -= batteryCycleLife;
      }
    }
  }

  // Cash flows indexed by year 0..N.
  const cashFlow: number[] = new Array(systemLifeYears + 1);
  cashFlow[0] = -totalCost;
  for (let year = 1; year <= systemLifeYears; year += 1) {
    const savings = annualSavings * Math.pow(1 + tariffEscalationRate, year - 1);
    const replacements = batteryReplacements
      .filter((r) => r.year === year)
      .reduce((sum, r) => sum + r.cost, 0);
    cashFlow[year] = savings - replacements;
  }

  const netPresentValue = round2(
    cashFlow.reduce((sum, value, year) => sum + value / Math.pow(1 + discountRate, year), 0),
  );

  let discountedPaybackYears: number | null = null;
  if (cashFlow[0] < 0) {
    let cumulative = cashFlow[0];
    for (let year = 1; year <= systemLifeYears; year += 1) {
      const previous = cumulative;
      cumulative += cashFlow[year] / Math.pow(1 + discountRate, year);
      if (previous < 0 && cumulative >= 0) {
        discountedPaybackYears = round2((year - 1) + -previous / (cumulative - previous));
        break;
      }
    }
  } else {
    discountedPaybackYears = 0;
  }

  const lifetimeEnergyKwh = annualProductionKwh * systemLifeYears;
  const lifetimeCost = round2(
    totalCost + batteryReplacements.reduce((sum, r) => sum + r.cost, 0),
  );
  const lcoe = lifetimeEnergyKwh > 0 ? round2(lifetimeCost / lifetimeEnergyKwh) : null;

  return {
    annualSavings: round2(annualSavings),
    simplePaybackYears,
    discountedPaybackYears,
    netPresentValue,
    lcoe,
    lifetimeCost,
    lifetimeEnergyKwh: round2(lifetimeEnergyKwh),
    annualBatteryCycles:
      annualBatteryCycles === null ? null : round2(annualBatteryCycles),
    batteryReplacements,
    systemLifeYears,
    discountRate,
    tariffEscalationRate,
  };
}
