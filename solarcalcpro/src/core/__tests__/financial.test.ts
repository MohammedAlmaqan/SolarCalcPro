import { analyzeFinancials } from '../formulas/financial';

describe('analyzeFinancials — cash-flow model', () => {
  it('computes simple payback, NPV and LCOE for a plain no-escalation case', () => {
    const analysis = analyzeFinancials({
      totalCost: 10000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      discountRate: 0.1,
      systemLifeYears: 5,
      tariffEscalationRate: 0,
    });
    expect(analysis.annualSavings).toBe(1000);
    expect(analysis.simplePaybackYears).toBe(10);
    // NPV = -10000 + 1000 * sum(1/1.1^t, t=1..5)
    expect(analysis.netPresentValue).toBeCloseTo(-10000 + 1000 * 3.790787, 2);
    expect(analysis.discountedPaybackYears).toBeNull();
    expect(analysis.lcoe).toBeCloseTo(10000 / 25000, 4);
    expect(analysis.lifetimeCost).toBe(10000);
    expect(analysis.lifetimeEnergyKwh).toBe(25000);
  });

  it('returns a discounted payback within the period when achievable', () => {
    const analysis = analyzeFinancials({
      totalCost: 3000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      discountRate: 0.1,
      systemLifeYears: 10,
      tariffEscalationRate: 0,
    });
    // Cumulative discounted cash flow crosses zero early.
    expect(analysis.simplePaybackYears).toBe(3);
    expect(analysis.discountedPaybackYears).toBeGreaterThan(3);
    expect(analysis.discountedPaybackYears).toBeLessThan(4);
    expect(analysis.netPresentValue).toBeGreaterThan(0);
  });

  it('escalation raises savings and NPV', () => {
    const flat = analyzeFinancials({
      totalCost: 5000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      discountRate: 0.1,
      systemLifeYears: 10,
      tariffEscalationRate: 0,
    });
    const escalating = analyzeFinancials({
      totalCost: 5000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      discountRate: 0.1,
      systemLifeYears: 10,
      tariffEscalationRate: 0.08,
    });
    expect(escalating.netPresentValue).toBeGreaterThan(flat.netPresentValue);
    expect(escalating.discountedPaybackYears as number).toBeLessThan(
      flat.discountedPaybackYears as number,
    );
  });

  it('models battery replacements from daily cycling and cycle life', () => {
    const analysis = analyzeFinancials({
      totalCost: 10000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      discountRate: 0,
      systemLifeYears: 10,
      tariffEscalationRate: 0,
      batteryKwh: 10,
      dailyCycledKwh: 4,
      batteryCycleLife: 500,
      batteryReplacementCost: 2000,
    });
    expect(analysis.annualBatteryCycles).toBeCloseTo(146, 1);
    expect(analysis.batteryReplacements.map((r) => r.year)).toEqual([4, 7]);
    // NPV = -10000 + 10×1000 − 2×2000 at a 0% discount rate.
    expect(analysis.netPresentValue).toBe(-4000);
    expect(analysis.lifetimeCost).toBe(14000);
    expect(analysis.lcoe).toBeCloseTo(14000 / 50000, 4);
  });

  it('reports no battery modeling for storage-less systems', () => {
    const analysis = analyzeFinancials({
      totalCost: 8000,
      annualProductionKwh: 6000,
      electricRate: 0.15,
    });
    expect(analysis.annualBatteryCycles).toBeNull();
    expect(analysis.batteryReplacements).toEqual([]);
  });

  it('returns null paybacks and LCOE when there is no production', () => {
    const analysis = analyzeFinancials({
      totalCost: 10000,
      annualProductionKwh: 0,
      electricRate: 0.2,
    });
    expect(analysis.simplePaybackYears).toBeNull();
    expect(analysis.discountedPaybackYears).toBeNull();
    expect(analysis.lcoe).toBeNull();
    expect(analysis.netPresentValue).toBe(-10000);
  });

  it('clamps out-of-range options', () => {
    const analysis = analyzeFinancials({
      totalCost: 10000,
      annualProductionKwh: 5000,
      electricRate: 0.2,
      systemLifeYears: 0,
      discountRate: 0.5,
      tariffEscalationRate: 0.9,
    });
    expect(analysis.systemLifeYears).toBe(1);
    expect(analysis.discountRate).toBe(0.25);
    expect(analysis.tariffEscalationRate).toBe(0.15);
  });
});
