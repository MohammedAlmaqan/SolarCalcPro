import { designSystem } from '../engine';
import { estimateCost } from '../formulas/costing';
import { buildBom } from '../../reports/bom';
import { buildSldDiagram } from '../../reports/sld';
import type {
  BatterySpec,
  ChargeControllerSpec,
  InverterSpec,
  LoadItem,
  SystemInput,
} from '../types';

/**
 * Real-world design scenarios, end to end.
 *
 * Three representative projects exercising the full engine against
 * hand-computed numbers:
 *   1. SIMPLE   — small off-grid mountain cabin on 12 V (single-string array)
 *   2. MODERATE — off-grid farmhouse + water pump + AC + backup generator (48 V)
 *   3. COMPLEX  — on-grid villa + EV charger + AC, sized on the worst monsoon month
 *
 * These tests document current behavior, including a known engine limitation:
 * the PV source OCPD is sized from the whole-array current (Isc × 1.56) and
 * compared against the per-panel max series fuse rating. Real multi-string
 * designs fuse each string individually, so any multi-string array is flagged
 * with NEC690-9-FUSE. See the "documented engine limitation" sections.
 */

const CABIN_BATTERY: BatterySpec = {
  id: 'bat-cabin-12v',
  brand: 'Test',
  model: 'LiFePO4 12V 100Ah',
  chemistry: 'lifepo4',
  nominalVoltageV: 12,
  capacityAh: 100,
  maxChargeCurrentA: 50,
  maxDischargeCurrentA: 100,
  recommendedDoD: 0.8,
  cycles: 6000,
};

const CABIN_INVERTER: InverterSpec = {
  id: 'inv-cabin-1000',
  brand: 'Test',
  model: 'Off-grid 1kW 12V',
  supportedTypes: ['off-grid', 'hybrid'],
  continuousPowerW: 1000,
  surgePowerW: 2000,
  batteryVoltageV: 12,
  maxPvVoltageV: 100,
  mpptVoltageRangeMinV: 12,
  mpptVoltageRangeMaxV: 90,
  maxPvCurrentA: 30,
  mpptCount: 1,
  maxAcOutputCurrentA: 5,
  efficiency: 0.9,
};

const FARM_CONTROLLER: ChargeControllerSpec = {
  id: 'cc-farm-100',
  brand: 'Test',
  model: 'MPPT 100A 450V',
  type: 'MPPT',
  ratedCurrentA: 100,
  maxPvVoltageV: 450,
  systemVoltageV: 48,
  efficiency: 0.94,
};

const VILLA_GRID_INVERTER: InverterSpec = {
  id: 'inv-villa-grid-15k',
  brand: 'Test',
  model: 'GRID 15kW 1000V',
  supportedTypes: ['on-grid', 'hybrid'],
  continuousPowerW: 15000,
  surgePowerW: 15000,
  batteryVoltageV: null,
  maxPvVoltageV: 1000,
  mpptVoltageRangeMinV: 200,
  mpptVoltageRangeMaxV: 850,
  maxPvCurrentA: 22,
  mpptCount: 3,
  maxAcOutputCurrentA: 65,
  efficiency: 0.98,
};

const load = (
  id: string,
  name: string,
  powerWatts: number,
  quantity: number,
  hoursPerDay: number,
  opts: { sim?: boolean; ind?: boolean; surgeFactor?: number } = {},
): LoadItem => ({
  id,
  name,
  powerWatts,
  quantity,
  hoursPerDay,
  isAc: true,
  isSimultaneous: opts.sim ?? false,
  isInductive: opts.ind ?? false,
  surgeFactor: opts.surgeFactor,
});

// ---------------------------------------------------------------------------
// CASE 1 — SIMPLE: off-grid mountain cabin, 12 V, single-string array
// ---------------------------------------------------------------------------

const cabinLoads: LoadItem[] = [
  load('c-l1', 'LED lights', 10, 6, 4, { sim: true }),
  load('c-l2', 'Mini fridge', 90, 1, 8, { sim: true, ind: true, surgeFactor: 5 }),
  load('c-l3', 'TV', 70, 1, 3, { sim: true }),
  load('c-l4', 'Laptop', 65, 1, 4, { sim: true }),
];

function cabinInput(): SystemInput {
  return {
    loads: cabinLoads,
    systemType: 'off-grid',
    winterPsh: 4.5,
    summerPsh: 6.0,
    autonomyDays: 2,
    chemistry: 'lifepo4',
    selected: { battery: CABIN_BATTERY, inverter: CABIN_INVERTER },
  };
}

describe('REAL WORLD — simple off-grid cabin (12 V)', () => {
  const result = designSystem(cabinInput());

  it('load audit matches the appliance sheet', () => {
    expect(result.dailyLoad.totalWhPerDay).toBe(1430);
    expect(result.dailyLoad.dcEquivalentWhPerDay).toBeCloseTo(1588.89, 1);
    expect(result.dailyLoad.peakSimultaneousWatts).toBe(285);
    expect(result.dailyLoad.peakSurgeWatts).toBe(645);
  });

  it('recommends a 12 V system for a sub-1 kW peak', () => {
    expect(result.battery.systemVoltageV).toBe(12);
  });

  it('sizes the PV array to a single 550 W panel', () => {
    expect(result.pv.requiredArrayWatts).toBeCloseTo(470.8, 0);
    expect(result.pv.totalPanelCount).toBe(1);
    expect(result.pv.seriesCount).toBe(1);
    expect(result.pv.parallelCount).toBe(1);
    expect(result.pv.actualArrayWatts).toBe(550);
    expect(result.pv.fitsInverterLimits).toBe(true);
  });

  it('sizes the battery bank to 4 × 12 V 100 Ah', () => {
    expect(result.battery.requiredAhAtSystemVoltage).toBeCloseTo(331.0, 0);
    expect(result.battery.parallelCount).toBe(4);
    expect(result.battery.batteryCount).toBe(4);
    expect(result.battery.actualCapacityAh).toBe(400);
    expect(result.battery.actualCapacityKwh).toBeCloseTo(4.8, 1);
  });

  it('sizes the inverter for the continuous and surge loads', () => {
    expect(result.inverter.recommendedContinuousWatts).toBe(500);
    expect(result.inverter.recommendedSurgeWatts).toBe(1000);
    expect(result.inverter.voltageMatch).toBe(true);
  });

  it('sizes the charge controller (MPPT ≥ Isc × 1.25)', () => {
    expect(result.controller.recommendedType).toBe('MPPT');
    expect(result.controller.minCurrentA).toBeCloseTo(17.5, 1);
  });

  it('sizes a 25 A PV source OCPD — exactly at the panel fuse rating', () => {
    expect(result.protection.pvSourceOcpdStandardA).toBe(25);
    expect(result.compliance.pvOcpdWithinSeriesFuse).toBe(true);
  });

  it('keeps cold-array Voc within the controller limit', () => {
    expect(result.compliance.arrayVocColdV).toBeCloseTo(54.96, 1);
    expect(result.compliance.arrayVocWithinInverterLimit).toBe(true);
  });

  it('sizes all three conductors for ampacity and voltage drop', () => {
    expect(result.cables.pvSource.crossSectionMm2).toBe(10);
    expect(result.cables.dcOutput.crossSectionMm2).toBe(16);
    expect(result.cables.acOutput.crossSectionMm2).toBe(1.5);
    expect(result.cables.pvSource.ampacityPasses).toBe(true);
    expect(result.cables.dcOutput.ampacityPasses).toBe(true);
    expect(result.cables.acOutput.ampacityPasses).toBe(true);
    expect(result.cables.pvSource.dropWithinLimit).toBe(true);
    expect(result.cables.dcOutput.dropWithinLimit).toBe(true);
    expect(result.cables.acOutput.dropWithinLimit).toBe(true);
  });

  it('produces a fully clean design — no warnings at all', () => {
    expect(result.warnings).toHaveLength(0);
  });

  it('records a complete audit trail', () => {
    expect(result.audit.some((s) => s.id === 'pv.string')).toBe(true);
    expect(result.audit.find((s) => s.id === 'battery.bank')?.result).toBe('1S4P = 4 batteries');
  });
});

// ---------------------------------------------------------------------------
// CASE 2 — MODERATE: off-grid farmhouse + pump + AC + backup generator (48 V)
// ---------------------------------------------------------------------------

const farmLoads: LoadItem[] = [
  load('f-l1', 'LED lighting', 10, 10, 5, { sim: true }),
  load('f-l2', 'Fridge', 150, 1, 12, { sim: true, ind: true, surgeFactor: 3 }),
  load('f-l3', 'Freezer', 180, 1, 10, { sim: true, ind: true, surgeFactor: 3 }),
  load('f-l4', 'TV', 150, 1, 4, { sim: true }),
  load('f-l5', 'Laptops', 65, 2, 6, { sim: true }),
  load('f-l6', 'Washing machine', 500, 1, 1, { ind: true, surgeFactor: 3 }),
  load('f-l7', 'Water pump', 750, 1, 2, { sim: true, ind: true, surgeFactor: 3 }),
  load('f-l8', 'Ceiling fans', 80, 4, 8, { sim: true }),
  load('f-l9', 'Kettle', 2000, 1, 0.25),
  load('f-l10', 'Toaster', 1000, 1, 0.2),
  load('f-l11', 'Desktop PC', 200, 1, 6, { sim: true }),
  load('f-l12', 'Split AC', 1200, 1, 6, { sim: true, ind: true, surgeFactor: 3 }),
];

function farmInput(): SystemInput {
  return {
    loads: farmLoads,
    systemType: 'off-grid',
    winterPsh: 4.0,
    summerPsh: 6.0,
    autonomyDays: 2,
    chemistry: 'lifepo4',
    fuelPricePerL: 1.2,
    selected: { controller: FARM_CONTROLLER },
  };
}

describe('REAL WORLD — moderate off-grid farmhouse (48 V + generator)', () => {
  const result = designSystem(farmInput());

  it('load audit matches the appliance sheet', () => {
    expect(result.dailyLoad.totalWhPerDay).toBe(19140);
    expect(result.dailyLoad.dcEquivalentWhPerDay).toBeCloseTo(21266.7, 0);
    expect(result.dailyLoad.peakSimultaneousWatts).toBe(3180);
    expect(result.dailyLoad.peakSurgeWatts).toBe(7740);
  });

  it('auto-recommends a 48 V system above the 3 kW peak', () => {
    expect(result.battery.systemVoltageV).toBe(48);
  });

  it('sizes the array to 14 × 550 W panels (7S × 2P)', () => {
    expect(result.pv.requiredArrayWatts).toBeCloseTo(7088.9, 0);
    expect(result.pv.totalPanelCount).toBe(14);
    expect(result.pv.seriesCount).toBe(7);
    expect(result.pv.parallelCount).toBe(2);
    expect(result.pv.actualArrayWatts).toBe(7700);
    expect(result.pv.fitsInverterLimits).toBe(true);
    expect(result.audit.find((s) => s.id === 'pv.string')?.result).toBe('7S × 2P = 14 panels');
  });

  it('keeps cold-array Voc within the 450 V controller', () => {
    expect(result.pv.arrayVocV).toBeCloseTo(349.3, 1);
    expect(result.compliance.arrayVocColdV).toBeCloseTo(384.8, 1);
    expect(result.compliance.arrayVocWithinInverterLimit).toBe(true);
    expect(result.compliance.controllerCurrentWithinLimit).toBe(true);
  });

  it('sizes the battery bank to 12 × 48 V 100 Ah', () => {
    expect(result.battery.requiredAhAtSystemVoltage).toBeCloseTo(1107.6, 0);
    expect(result.battery.parallelCount).toBe(12);
    expect(result.battery.batteryCount).toBe(12);
    expect(result.battery.actualCapacityKwh).toBeCloseTo(57.6, 1);
  });

  it('sizes the inverter and verifies the 5 kW reference fits', () => {
    expect(result.inverter.recommendedContinuousWatts).toBe(5000);
    expect(result.inverter.recommendedSurgeWatts).toBe(10000);
    expect(result.inverter.voltageMatch).toBe(true);
    expect(result.compliance.inverterPowerSufficient).toBe(true);
  });

  it('sizes the backup generator from the battery recharge window', () => {
    expect(result.generator).toBeDefined();
    expect(result.generator!.requiredChargerKw).toBeCloseTo(11.5, 1);
    expect(result.generator!.recommendedKw).toBe(15);
    expect(result.generator!.dailyFuelL).toBeCloseTo(6.4, 1);
    // Fuel cost is derived from the raw daily figure (dcEq × 0.3 L/kWh).
    const rawDailyFuelL = (result.dailyLoad.dcEquivalentWhPerDay / 1000) * 0.3;
    expect(result.generator!.annualFuelL).toBe(Math.round(rawDailyFuelL * 365));
    expect(result.generator!.annualFuelCost).toBe(Math.round(rawDailyFuelL * 365 * 1.2));
  });

  it('sizes all three conductors for ampacity and voltage drop', () => {
    expect(result.cables.pvSource.crossSectionMm2).toBe(25);
    expect(result.cables.dcOutput.crossSectionMm2).toBe(50);
    expect(result.cables.acOutput.crossSectionMm2).toBe(4);
    expect(result.cables.pvSource.ampacityPasses).toBe(true);
    expect(result.cables.dcOutput.ampacityPasses).toBe(true);
    expect(result.cables.acOutput.ampacityPasses).toBe(true);
    for (const circuit of [result.cables.pvSource, result.cables.dcOutput, result.cables.acOutput]) {
      expect(circuit.dropWithinLimit).toBe(true);
    }
  });

  it('documented engine limitation: multi-string array is flagged NEC690-9-FUSE', () => {
    // Array-level OCPD = Isc_total × 1.56 = 28 × 1.56 → 50 A, compared against
    // the per-panel 25 A series fuse rating. Real designs fuse each string
    // individually (7A × 1.56 → 15 A per string), which the engine cannot model.
    expect(result.protection.pvSourceOcpdStandardA).toBe(50);
    expect(result.compliance.pvOcpdWithinSeriesFuse).toBe(false);
    const fuse = result.warnings.find((w) => w.code === 'NEC690-9-FUSE');
    expect(fuse).toBeDefined();
    expect(fuse?.severity).toBe('error');
    expect(result.warnings.filter((w) => w.severity === 'error').map((w) => w.code)).toEqual([
      'NEC690-9-FUSE',
    ]);
  });

  it('advisory policy downgrades the fuse flag so the design still completes', () => {
    const advisory = designSystem({ ...farmInput(), standardsPolicy: 'advisory' });
    const fuse = advisory.warnings.find((w) => w.code === 'NEC690-9-FUSE');
    expect(fuse?.severity).toBe('warning');
    expect(advisory.warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
  });

  it('off policy hides the standards check entirely', () => {
    const off = designSystem({ ...farmInput(), standardsPolicy: 'off' });
    expect(off.warnings.some((w) => w.code.startsWith('NEC'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CASE 3 — COMPLEX: on-grid villa + EV + AC, sized on the worst monsoon month
// ---------------------------------------------------------------------------

const MONSOON_PROFILE = [5.1, 5.3, 5.4, 4.9, 4.2, 3.4, 3.1, 3.3, 3.9, 4.6, 5.0, 5.2];

const villaLoads: LoadItem[] = [
  load('v-l1', 'LED lighting', 10, 20, 5, { sim: true }),
  load('v-l2', 'Fridge', 150, 1, 12, { sim: true, ind: true, surgeFactor: 3 }),
  load('v-l3', 'Freezer', 180, 1, 10),
  load('v-l4', 'TVs', 100, 2, 6, { sim: true }),
  load('v-l5', 'Laptops', 65, 3, 8, { sim: true }),
  load('v-l6', 'Washing machine', 500, 1, 1, { ind: true, surgeFactor: 3 }),
  load('v-l7', 'Dishwasher', 1200, 1, 1),
  load('v-l8', 'Microwave', 1000, 1, 0.5),
  load('v-l9', 'Electric oven', 2000, 1, 0.5),
  load('v-l10', 'Central AC', 2400, 1, 6, { sim: true, ind: true, surgeFactor: 3 }),
  load('v-l11', 'EV charger', 7400, 1, 2),
];

function villaInput(): SystemInput {
  return {
    loads: villaLoads,
    systemType: 'on-grid',
    winterPsh: 4.5,
    summerPsh: 6.0,
    monthlyPsh: MONSOON_PROFILE,
    latitude: 15,
    autonomyDays: 0,
    chemistry: 'lifepo4',
    selected: { inverter: VILLA_GRID_INVERTER },
  };
}

describe('REAL WORLD — complex on-grid villa + EV (worst monsoon month)', () => {
  const result = designSystem(villaInput());

  it('load audit matches the appliance sheet', () => {
    expect(result.dailyLoad.totalWhPerDay).toBe(39760);
    expect(result.dailyLoad.dcEquivalentWhPerDay).toBeCloseTo(44177.8, 0);
    expect(result.dailyLoad.peakSimultaneousWatts).toBe(3145);
    expect(result.dailyLoad.peakSurgeWatts).toBe(8245);
  });

  it('sizes the array on the worst month (July, 3.1 PSH) not the winter anchor', () => {
    const worst = result.audit.find((s) => s.id === 'pv.worstMonth');
    expect(worst?.result).toBe(3.1);
    expect(worst?.values.worstMonth).toBe(7);
    // Winter anchor alone would demand far less; the monsoon profile drives it.
    expect(result.pv.requiredArrayWatts).toBeCloseTo(19001.2, 0);
  });

  it('builds an 18S × 2P array on the 1000 V inverter MPPT window', () => {
    expect(result.pv.totalPanelCount).toBe(36);
    expect(result.pv.seriesCount).toBe(18);
    expect(result.pv.parallelCount).toBe(2);
    expect(result.pv.actualArrayWatts).toBe(19800);
    expect(result.pv.arrayVocV).toBeCloseTo(898.2, 1);
    expect(result.pv.arrayVmpV).toBeCloseTo(748.8, 1);
    expect(result.pv.fitsInverterLimits).toBe(true);
  });

  it('keeps the cold-array Voc inside the 1000 V limit — narrowly', () => {
    // 18 × 49.9 V at −10 °C ≈ 989 V; a 1000 V inverter leaves < 2% margin.
    expect(result.compliance.arrayVocColdV).toBeCloseTo(989.4, 0);
    expect(result.compliance.arrayVocWithinInverterLimit).toBe(true);
    expect(result.compliance.arrayVocColdV).toBeLessThan(1000);
  });

  it('simulates ~20 MWh/yr with a realistic performance ratio', () => {
    expect(result.production.annualKwh).toBeGreaterThan(18000);
    expect(result.production.annualKwh).toBeLessThan(24000);
    expect(result.production.performanceRatio).toBeGreaterThan(0.65);
    expect(result.production.performanceRatio).toBeLessThan(0.75);
    expect(result.production.months[6].energyKwh).toBe(result.production.monthlyEnergyKwh[6]);
  });

  it('omits battery and generator for an on-grid design', () => {
    expect(result.battery.batteryCount).toBe(0);
    expect(result.generator).toBeUndefined();
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain('BATTERY-NOT-REQUIRED');
  });

  it('sizes the inverter for continuous load and verifies the 15 kW unit', () => {
    expect(result.inverter.recommendedContinuousWatts).toBe(5000);
    expect(result.inverter.recommendedSurgeWatts).toBe(10000);
    expect(result.inverter.voltageMatch).toBe(true);
    expect(result.compliance.inverterPowerSufficient).toBe(true);
  });

  it('flags the default 200 A main panel for the 120% backfeed rule', () => {
    // 65 A inverter output → 100 A breaker; 200 + 100 > 1.2 × 200.
    expect(result.protection.acBreakerStandardA).toBe(100);
    expect(result.protection.backfeedPasses).toBe(false);
    const backfeed = result.warnings.find((w) => w.code === 'NEC705-12-BACKFEED');
    expect(backfeed).toBeDefined();
    expect(backfeed?.severity).toBe('warning');
  });

  it('passes the backfeed rule with a 400 A busbar', () => {
    const upgraded = designSystem({ ...villaInput(), busbarRatingA: 400 });
    expect(upgraded.protection.backfeedPasses).toBe(true);
    expect(upgraded.protection.backfeedMarginPct).toBeCloseTo(37.5, 1);
  });

  it('documented engine limitation: multi-string array is flagged NEC690-9-FUSE', () => {
    // Same single-OCPD model as the farmhouse case: 28 A × 1.56 → 50 A > 25 A.
    expect(result.compliance.pvOcpdWithinSeriesFuse).toBe(false);
    const fuse = result.warnings.find((w) => w.code === 'NEC690-9-FUSE');
    expect(fuse?.severity).toBe('error');
  });

  it('advisory policy clears all errors once the busbar is upgraded', () => {
    const clean = designSystem({
      ...villaInput(),
      busbarRatingA: 400,
      standardsPolicy: 'advisory',
    });
    expect(clean.warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// END-TO-END — the farmhouse design flows into cost, BOM and SLD reports
// ---------------------------------------------------------------------------

describe('REAL WORLD — farmhouse design feeds costing and reports', () => {
  const result = designSystem(farmInput());

  it('produces a positive cost estimate with all major line items', () => {
    const cost = estimateCost(result, { electricRate: 0.12, currency: '$' });
    expect(cost.total).toBeGreaterThan(0);
    const ids = cost.lines.map((l) => l.id);
    expect(ids).toEqual(
      expect.arrayContaining(['pv-modules', 'inverter', 'batteries', 'controller', 'generator']),
    );
    expect(cost.annualProductionKwh).toBeGreaterThan(0);
    expect(cost.annualSavings).toBeGreaterThan(0);
    expect(cost.simplePaybackYears).toBeGreaterThan(0);
    expect(cost.batteryAging).toBeDefined();
  });

  it('builds a BOM covering every design category', () => {
    const bom = buildBom(result);
    const categories = new Set(bom.map((item) => item.category));
    for (const category of [
      'PV modules',
      'Inverter',
      'Battery bank',
      'Charge controller',
      'Cables',
      'Protection',
      'Backup generator',
    ]) {
      expect(categories.has(category)).toBe(true);
    }
    const panels = bom.find((item) => item.category === 'PV modules');
    expect(panels?.qty).toBe(result.pv.totalPanelCount);
  });

  it('builds a single-line diagram whose edges all resolve to nodes', () => {
    const diagram = buildSldDiagram(result);
    expect(diagram.nodes.some((n) => n.id === 'generator')).toBe(true);
    expect(diagram.nodes.some((n) => n.id === 'battery')).toBe(true);
    const ids = new Set(diagram.nodes.map((n) => n.id));
    for (const edge of diagram.edges) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });
});
