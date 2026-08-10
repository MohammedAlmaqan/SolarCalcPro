import {
  batteryAgingAnalysis,
  batteryLifespanYears,
  cycleLifeAtDoD,
} from '../formulas/batteryAging';

describe('cycleLifeAtDoD — DoD ↔ cycle-life tradeoff', () => {
  it('returns the rated cycle life at the rated DoD', () => {
    expect(cycleLifeAtDoD(6000, 0.8, 0.8, 'lifepo4')).toBe(6000);
  });

  it('extends life when cycling shallower than the rating', () => {
    const life = cycleLifeAtDoD(6000, 0.8, 0.5, 'lifepo4');
    expect(life).toBeGreaterThan(6000);
    expect(life).toBeCloseTo(6000 * Math.pow(0.8 / 0.5, 1.15), 0);
  });

  it('shortens life when cycling deeper than the rating', () => {
    const life = cycleLifeAtDoD(6000, 0.8, 1.0, 'lifepo4');
    expect(life).toBeLessThan(6000);
    expect(life).toBeCloseTo(6000 * Math.pow(0.8, 1.15), 0);
  });

  it('rewards shallow cycling more strongly for flooded lead-acid', () => {
    const lifepo4 = cycleLifeAtDoD(6000, 0.8, 0.4, 'lifepo4');
    const flooded = cycleLifeAtDoD(6000, 0.8, 0.4, 'flooded');
    expect(flooded).toBeGreaterThan(lifepo4);
  });

  it('clamps the DoD to a sensible floor and ignores zero ratings', () => {
    expect(cycleLifeAtDoD(6000, 0.8, 0, 'agm-gel')).toBeCloseTo(6000 * Math.pow(8, 1.3), 0);
    expect(cycleLifeAtDoD(0, 0.8, 0.5, 'lifepo4')).toBe(0);
  });
});

describe('batteryLifespanYears', () => {
  it('converts cycles to years at the daily cycling rate', () => {
    expect(batteryLifespanYears(1, 6000)).toBeCloseTo(6000 / 365, 2);
    expect(batteryLifespanYears(0.25, 6000)).toBeCloseTo(6000 / (0.25 * 365), 2);
  });

  it('never expires when the battery is not cycled', () => {
    expect(batteryLifespanYears(0, 6000)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('batteryAgingAnalysis', () => {
  it('flags a replacement when cycling eats the cycle life inside the window', () => {
    const aging = batteryAgingAnalysis({
      ratedCycles: 6000,
      ratedDoD: 0.8,
      actualDoD: 0.5,
      chemistry: 'lifepo4',
      batteryKwh: 1.2,
      dailyCycledKwh: 2.35,
    });
    const cyclesPerDay = 2.35 / 1.2;
    const lifespan = 6000 * Math.pow(0.8 / 0.5, 1.15) / (cyclesPerDay * 365);
    expect(aging.lifespanYears).toBeGreaterThan(0);
    expect(aging.lifespanYears).toBeLessThan(25);
    expect(aging.replacementYears).toContain(Math.round(lifespan));
    expect(aging.recommendation).toMatch(/replacement/i);
  });

  it('outlasts the analysis period for light hybrid cycling', () => {
    const aging = batteryAgingAnalysis({
      ratedCycles: 6000,
      ratedDoD: 0.8,
      actualDoD: 0.5,
      chemistry: 'lifepo4',
      batteryKwh: 9.6,
      dailyCycledKwh: 2.35,
    });
    expect(aging.recommendation).toMatch(/outlasts/i);
    expect(aging.replacementYears).toEqual([]);
  });

  it('handles a dormant battery (no cycling) gracefully', () => {
    const aging = batteryAgingAnalysis({
      ratedCycles: 6000,
      ratedDoD: 0.8,
      actualDoD: 0.8,
      chemistry: 'lifepo4',
      batteryKwh: 9.6,
      dailyCycledKwh: 0,
    });
    expect(aging.lifespanYears).toBe(Number.POSITIVE_INFINITY);
    expect(aging.replacementYears).toEqual([]);
  });
});
