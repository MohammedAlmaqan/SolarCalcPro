import { designSystem } from '../engine';
import { DEFAULT_PRICE_BOOK, estimateCost, type CostEstimate } from '../formulas/costing';
import type { SystemInput } from '../types';
import { WORKED_LOADS } from './load.test';

const HYBRID_INPUT: SystemInput = {
  loads: WORKED_LOADS,
  systemType: 'hybrid',
  winterPsh: 4.0,
  summerPsh: 6.0,
  autonomyDays: 2,
  chemistry: 'lifepo4',
  systemVoltageOverride: 48,
  pvCableLengthM: 15,
  dcCableLengthM: 3,
  acCableLengthM: 20,
};

function estimateFor(
  input: SystemInput,
  options?: Parameters<typeof estimateCost>[1],
): CostEstimate {
  return estimateCost(designSystem(input), options);
}

describe('estimateCost — line items scale with the sized design', () => {
  const estimate = estimateFor(HYBRID_INPUT);
  const result = designSystem(HYBRID_INPUT);

  it('prices the PV array by panel count and total wattage', () => {
    const pvLine = estimate.lines.find((l) => l.id === 'pv-modules');
    expect(pvLine?.quantity).toBe(result.pv.totalPanelCount);
    expect(pvLine?.total).toBeCloseTo(
      result.pv.actualArrayWatts * DEFAULT_PRICE_BOOK.panelDollarsPerWatt,
      2,
    );
  });

  it('prices the battery bank per battery at the chemistry rate', () => {
    const batteryLine = estimate.lines.find((l) => l.id === 'batteries');
    expect(batteryLine?.quantity).toBe(result.battery.batteryCount);
    expect(batteryLine?.unitPrice).toBeCloseTo(
      (result.battery.actualCapacityKwh / result.battery.batteryCount) *
        DEFAULT_PRICE_BOOK.batteryDollarsPerKwh.lifepo4,
      2,
    );
  });

  it('bills cable runs as 2× one-way length at the conductor price', () => {
    const pvCable = estimate.lines.find((l) => l.id === 'cable-pv');
    expect(pvCable?.quantity).toBe(30);
    expect(pvCable?.unitPrice).toBeCloseTo(
      result.cables.pvSource.crossSectionMm2 * DEFAULT_PRICE_BOOK.cableDollarsPerMeterPerMm2,
      2,
    );
    const acCable = estimate.lines.find((l) => l.id === 'cable-ac');
    expect(acCable?.quantity).toBe(40);
  });

  it('rolls up subtotal, BOS, labor and total', () => {
    const equipment = estimate.lines.reduce((sum, l) => sum + l.total, 0);
    expect(estimate.equipmentSubtotal).toBeCloseTo(equipment, 2);
    expect(estimate.bosTotal).toBeCloseTo(equipment * 0.12, 2);
    expect(estimate.laborTotal).toBeCloseTo(equipment * 0.15, 2);
    expect(estimate.total).toBeCloseTo(
      estimate.equipmentSubtotal + estimate.bosTotal + estimate.laborTotal,
      2,
    );
  });

  it('computes a production-based payback at the electric rate', () => {
    const avgPsh = (4 + 6) / 2;
    const expectedProduction = (result.pv.actualArrayWatts * avgPsh * 365 * 0.75) / 1000;
    expect(estimate.annualProductionKwh).toBeCloseTo(expectedProduction, 2);
    expect(estimate.annualSavings).toBeCloseTo(expectedProduction * 0.15, 2);
    expect(estimate.simplePaybackYears).toBeCloseTo(estimate.total / estimate.annualSavings, 2);
  });

  it('reflects a custom electric rate and currency', () => {
    const custom = estimateFor(HYBRID_INPUT, { electricRate: 0.25, currency: '€' });
    expect(custom.currency).toBe('€');
    expect(custom.annualSavings).toBeCloseTo(custom.annualProductionKwh * 0.25, 2);
    expect(custom.simplePaybackYears).toBeLessThan(estimate.simplePaybackYears as number);
  });

  it('returns no payback when the electric rate is zero', () => {
    const zero = estimateFor(HYBRID_INPUT, { electricRate: 0 });
    expect(zero.annualSavings).toBe(0);
    expect(zero.simplePaybackYears).toBeNull();
  });

  it('honors a custom price book override', () => {
    const custom = estimateFor(HYBRID_INPUT, { priceBook: { panelDollarsPerWatt: 0.5 } });
    const pvLine = custom.lines.find((l) => l.id === 'pv-modules');
    expect(pvLine?.total).toBeCloseTo(designSystem(HYBRID_INPUT).pv.actualArrayWatts * 0.5, 2);
  });
});

describe('estimateCost — system type shapes the bill of materials', () => {
  it('skips battery, controller and DC cable for on-grid systems', () => {
    const onGrid: SystemInput = {
      loads: WORKED_LOADS,
      systemType: 'on-grid',
      winterPsh: 4.0,
      summerPsh: 6.0,
      autonomyDays: 1,
      chemistry: 'lifepo4',
    };
    const estimate = estimateFor(onGrid);
    expect(estimate.lines.find((l) => l.id === 'batteries')).toBeUndefined();
    expect(estimate.lines.find((l) => l.id === 'controller')).toBeUndefined();
    expect(estimate.lines.find((l) => l.id === 'cable-dc')).toBeUndefined();
    expect(estimate.lines.find((l) => l.id === 'cable-pv')).toBeDefined();
    expect(estimate.lines.find((l) => l.id === 'cable-ac')).toBeDefined();
  });

  it('includes a charge controller line only for off-grid systems', () => {
    const offGrid: SystemInput = {
      loads: WORKED_LOADS,
      systemType: 'off-grid',
      winterPsh: 4.0,
      summerPsh: 6.0,
      autonomyDays: 2,
      chemistry: 'lifepo4',
    };
    const estimate = estimateFor(offGrid);
    expect(estimate.lines.find((l) => l.id === 'controller')).toBeDefined();
    expect(estimate.lines.find((l) => l.id === 'batteries')).toBeDefined();
  });
});

describe('estimateCost — price book defaults', () => {
  it('keeps sane ranges for every price entry', () => {
    const book = DEFAULT_PRICE_BOOK;
    expect(book.panelDollarsPerWatt).toBeGreaterThan(0.1);
    expect(book.panelDollarsPerWatt).toBeLessThan(2);
    expect(book.batteryDollarsPerKwh.lifepo4).toBeGreaterThan(100);
    expect(book.batteryDollarsPerKwh.flooded).toBeLessThan(book.batteryDollarsPerKwh.lifepo4);
    expect(book.bosPct).toBeGreaterThan(0);
    expect(book.laborPct).toBeGreaterThan(0);
  });

  it('tags every line with a category for the costed BOM', () => {
    const estimate = estimateFor(HYBRID_INPUT);
    expect(estimate.lines.length).toBeGreaterThan(0);
    for (const item of estimate.lines) {
      expect(item.category).toBeTruthy();
    }
    const pvLine = estimate.lines.find((l) => l.id === 'pv-modules');
    expect(pvLine?.category).toBe('PV modules');
    const cableLine = estimate.lines.find((l) => l.id === 'cable-pv');
    expect(cableLine?.category).toBe('Cables');
  });
});
