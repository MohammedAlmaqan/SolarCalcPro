/**
 * PVWatts-style monthly production simulation (study §6).
 *
 * A seasonal irradiance curve is synthesized from the two entered peak-sun
 * hour values (winter/summer) using a latitude-aware cosine model, then a
 * per-month cell-temperature derate and a flat system derate (inverter,
 * soiling, mismatch, wiring, shading) are applied. All functions are pure.
 */

import type { MonthlyProduction, ProductionResult } from '../types';

export interface ProductionInput {
  arrayWatts: number;
  /** Winter peak sun hours (kWh/m²/day). */
  winterPsh: number;
  /** Summer peak sun hours (kWh/m²/day). */
  summerPsh: number;
  /** Site latitude (°); flips the seasonal peak for the southern hemisphere. */
  latitude?: number;
  /** Pmax temperature coefficient (%/°C), negative, e.g. −0.35. */
  tempCoeffPmax: number;
  /** Non-temperature system derate, default 0.75 (inverter + BOS losses). */
  systemDerate?: number;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(month: number): string {
  return MONTH_LABELS[(month - 1 + 12) % 12];
}

/**
 * Synthesize a monthly PSH curve from winter/summer values.
 * Model: PSH(m) = mean + amplitude × cos((m − peak)π/6), with the seasonal
 * peak at mid-July in the northern hemisphere and mid-January south of the
 * equator. Equatorial sites (winter ≈ summer) collapse to a flat curve.
 */
export function synthMonthlyPsh(winterPsh: number, summerPsh: number, latitude?: number): number[] {
  const mean = (summerPsh + winterPsh) / 2;
  const amplitude = (summerPsh - winterPsh) / 2;
  const peakMonth = (latitude ?? 25) < 0 ? 12.5 : 6.5;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const value = mean + amplitude * Math.cos(((month - peakMonth) * Math.PI) / 6);
    return Math.max(0, value);
  });
}

/**
 * Approximate monthly ambient temperature from latitude using an annual
 * sinusoid: mean annual temperature falls with |latitude| and the seasonal
 * swing grows with |latitude|. Warmest month is July north, January south.
 */
export function deriveMonthlyAmbient(latitude?: number): number[] {
  const lat = Math.abs(latitude ?? 25);
  const meanC = 28 - 0.5 * lat;
  const swingC = Math.min(11, 4 + lat * 0.13);
  const warmestMonth = (latitude ?? 25) < 0 ? 1.5 : 7.5;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const value = meanC + swingC * Math.cos(((month - warmestMonth) * Math.PI) / 6);
    return Math.max(-30, value);
  });
}

/**
 * Monthly energy yield (kWh):
 *   E_m = arrayWatts × PSH_m × days_m × tempDerate_m × systemDerate ÷ 1000
 *
 * Cell temperature ≈ ambient + 25 °C nominal rise; the derate follows the
 * panel's Pmax temperature coefficient:
 *   tempDerate = 1 + (tempCoeffPmax ÷ 100) × (cellTemp − 25)
 *
 * Performance ratio = annual yield ÷ nameplate yield
 *   (arrayWatts/1000 × Σ PSH_m·days_m), i.e. 1 PSH = 1 kWh/m² of irradiation.
 */
export function estimateProduction(input: ProductionInput): ProductionResult {
  const latitude = input.latitude;
  const monthlyPsh = synthMonthlyPsh(input.winterPsh, input.summerPsh, latitude);
  const ambient = deriveMonthlyAmbient(latitude);
  const systemDerate = Math.min(1, Math.max(0.3, input.systemDerate ?? 0.75));

  const months: MonthlyProduction[] = monthlyPsh.map((psh, i) => {
    const month = i + 1;
    const daysInMonth = DAYS_IN_MONTH[i];
    const ambientC = ambient[i];
    const cellTempC = ambientC + 25;
    const temperatureDerate = Math.max(
      0.5,
      Math.min(1.2, 1 + (input.tempCoeffPmax / 100) * (cellTempC - 25)),
    );
    const energyKwh = (input.arrayWatts * psh * daysInMonth * temperatureDerate * systemDerate) / 1000;
    return {
      month,
      daysInMonth,
      psh,
      ambientC: Math.round(ambientC * 10) / 10,
      cellTempC: Math.round(cellTempC * 10) / 10,
      temperatureDerate: Math.round(temperatureDerate * 1000) / 1000,
      energyKwh: Math.round(energyKwh * 100) / 100,
    };
  });

  const annualKwh = Math.round(months.reduce((sum, m) => sum + m.energyKwh, 0) * 100) / 100;
  const idealKwh = input.arrayWatts / 1000 * months.reduce((sum, m) => sum + m.psh * m.daysInMonth, 0);
  const performanceRatio =
    idealKwh > 0 ? Math.round((annualKwh / idealKwh) * 1000) / 1000 : 0;

  const weightedIrradiance = months.reduce((sum, m) => sum + m.psh * m.daysInMonth, 0);
  const temperatureDerateAvg =
    weightedIrradiance > 0
      ? Math.round(
          (months.reduce((sum, m) => sum + m.temperatureDerate * m.psh * m.daysInMonth, 0) /
            weightedIrradiance) *
            1000,
        ) / 1000
      : 0;

  return {
    months,
    monthlyPsh,
    monthlyEnergyKwh: months.map((m) => m.energyKwh),
    annualKwh,
    performanceRatio,
    temperatureDerateAvg,
    systemDerate,
  };
}
