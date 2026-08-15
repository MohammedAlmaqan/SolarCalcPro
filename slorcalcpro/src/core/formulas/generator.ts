import type { AuditTrail } from '../audit';
import type { GeneratorResult } from '../types';
import { round } from '../data/cableTable';

/**
 * Generator sizing for hybrid/off-grid systems (study §3.6):
 *   Charger rating covers recharging the daily energy (or the cycled part of
 *   the battery bank) within a recharge window.
 *   Generator rating must cover the peak simultaneous load AND the charger
 *   load together, with a safety margin, rounded to standard genset sizes.
 *   Fuel estimate uses the genset specific consumption (~0.3 L/kWh diesel).
 */

export const DEFAULT_CHARGE_HOURS_PER_DAY = 4;
export const DEFAULT_GENERATOR_SAFETY_FACTOR = 1.25;
export const DEFAULT_SPECIFIC_FUEL_L_PER_KWH = 0.3;
/** Typical diesel genset load factor while running. */
export const DEFAULT_GENERATOR_LOAD_FACTOR = 0.7;

const STANDARD_KW = [2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100];

function nextStandardKw(kw: number): number {
  const match = STANDARD_KW.find((s) => s >= kw);
  return match ?? Math.ceil(kw / 10) * 10;
}

export interface GeneratorInput {
  /** Peak simultaneous load (W). */
  peakSimultaneousWatts: number;
  /** Daily DC-equivalent energy (kWh/day) the generator must cover. */
  dailyEnergyKwh: number;
  /** Actual battery bank capacity (kWh). */
  batteryCapacityKwh: number;
  /** Depth of discharge applied to the bank (0–1). */
  depthOfDischarge: number;
  /** Recharge window in hours per day, default 4. */
  chargeHoursPerDay?: number;
  safetyFactor?: number;
  specificFuelLPerKwh?: number;
  /** Fuel price (currency/L) to also produce a running-cost estimate. */
  fuelPricePerL?: number;
}

export function sizeGenerator(input: GeneratorInput, audit: AuditTrail): GeneratorResult {
  const chargeHours = input.chargeHoursPerDay ?? DEFAULT_CHARGE_HOURS_PER_DAY;
  const safetyFactor = input.safetyFactor ?? DEFAULT_GENERATOR_SAFETY_FACTOR;
  const specificFuel = input.specificFuelLPerKwh ?? DEFAULT_SPECIFIC_FUEL_L_PER_KWH;

  const cycledEnergyKwh = input.batteryCapacityKwh * input.depthOfDischarge;
  const rechargeEnergyKwh = Math.max(input.dailyEnergyKwh, cycledEnergyKwh);
  const chargerKw = rechargeEnergyKwh / chargeHours;

  const peakKw = input.peakSimultaneousWatts / 1000;
  const requiredKw = Math.max(chargerKw, peakKw) * safetyFactor;
  const recommendedKw = nextStandardKw(requiredKw);

  const dailyFuelL = input.dailyEnergyKwh * specificFuel;
  const annualFuelL = dailyFuelL * 365;
  const runtimeHoursPerDay = rechargeEnergyKwh / (recommendedKw * DEFAULT_GENERATOR_LOAD_FACTOR);
  const annualFuelCost =
    input.fuelPricePerL != null ? annualFuelL * input.fuelPricePerL : null;

  audit.add({
    id: 'generator.charger',
    description: 'Required battery charger rating',
    formula: 'max(dailyKwh, batteryKwh × DoD) ÷ chargeHours',
    values: {
      dailyKwh: round(input.dailyEnergyKwh),
      batteryKwh: round(input.batteryCapacityKwh),
      depthOfDischarge: round(input.depthOfDischarge),
      chargeHours,
    },
    result: round(chargerKw),
    unit: 'kW',
  });

  audit.add({
    id: 'generator.rating',
    description: 'Recommended generator rating',
    formula: 'max(chargerKw, peakLoadKw) × safetyFactor → standard size',
    values: {
      chargerKw: round(chargerKw),
      peakLoadKw: round(peakKw),
      safetyFactor,
    },
    result: recommendedKw,
    unit: 'kW',
  });

  audit.add({
    id: 'generator.fuel',
    description: 'Estimated daily fuel consumption',
    formula: 'dailyKwh × specificConsumption',
    values: {
      dailyKwh: round(input.dailyEnergyKwh),
      specificFuelLPerKwh: specificFuel,
    },
    result: round(dailyFuelL),
    unit: 'L/day',
  });

  return {
    requiredChargerKw: round(chargerKw),
    recommendedKw,
    dailyFuelL: round(dailyFuelL),
    annualFuelL: Math.round(annualFuelL),
    annualFuelCost: annualFuelCost == null ? null : Math.round(annualFuelCost),
    runtimeHoursPerDay: round(runtimeHoursPerDay),
  };
}
