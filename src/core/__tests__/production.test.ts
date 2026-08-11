import { deriveMonthlyAmbient, estimateProduction, monthLabel, synthMonthlyPsh } from '../formulas/production';

describe('synthMonthlyPsh — seasonal irradiance curve', () => {
  it('flattens to a constant curve for equatorial sites', () => {
    const curve = synthMonthlyPsh(5, 5, 0);
    for (const psh of curve) expect(psh).toBeCloseTo(5, 6);
  });

  it('peaks in summer and bottoms in winter for the northern hemisphere', () => {
    const curve = synthMonthlyPsh(2, 6, 30);
    expect(curve[0]).toBeCloseTo(2.068, 2);
    expect(curve[6]).toBeCloseTo(5.932, 2);
    expect(curve[5]).toBeCloseTo(5.932, 2);
    expect(curve[11]).toBeCloseTo(2.068, 2);
    expect(curve[6]).toBeGreaterThan(curve[0]);
    expect(curve[0]).toBeGreaterThanOrEqual(2);
  });

  it('flips the seasonal peak for the southern hemisphere', () => {
    const curve = synthMonthlyPsh(2, 6, -33);
    expect(curve[0]).toBeGreaterThan(curve[6]);
    expect(curve[11]).toBeGreaterThan(curve[6]);
  });

  it('never produces negative sun hours', () => {
    for (const psh of synthMonthlyPsh(0.5, 8, 60)) expect(psh).toBeGreaterThanOrEqual(0);
  });
});

describe('deriveMonthlyAmbient — latitude temperature model', () => {
  it('is cooler on average at higher latitudes', () => {
    const warm = deriveMonthlyAmbient(0);
    const cold = deriveMonthlyAmbient(60);
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    expect(mean(cold)).toBeLessThan(mean(warm));
  });

  it('places the warmest month in July north of the equator', () => {
    const ambient = deriveMonthlyAmbient(40);
    expect(ambient[6]).toBe(Math.max(...ambient));
  });
});

describe('estimateProduction — monthly yield & performance ratio', () => {
  it('produces exact nameplate energy with no losses', () => {
    const result = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5,
      summerPsh: 5,
      latitude: 0,
      tempCoeffPmax: 0,
      systemDerate: 1,
    });
    expect(result.annualKwh).toBe(1825);
    expect(result.performanceRatio).toBe(1);
    expect(result.months).toHaveLength(12);
    expect(result.months[0].energyKwh).toBe(155); // 1000 W × 5 h × 31 d ÷ 1000
  });

  it('applies a temperature derate from the cell temperature rise', () => {
    const result = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5,
      summerPsh: 5,
      latitude: 0,
      tempCoeffPmax: -0.35,
      systemDerate: 1,
    });
    const july = result.months[6];
    // July ambient ≈ 31.86 °C → cell ≈ 56.86 °C → derate ≈ 0.888
    expect(july.ambientC).toBeCloseTo(31.9, 0);
    expect(july.temperatureDerate).toBeCloseTo(0.888, 2);
    expect(july.energyKwh).toBeCloseTo(137.7, 0);
    expect(result.annualKwh).toBeLessThan(1825);
    expect(result.performanceRatio).toBeLessThan(1);
    expect(result.performanceRatio).toBeGreaterThan(0);
  });

  it('scales linearly with the system derate', () => {
    const half = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5,
      summerPsh: 5,
      latitude: 0,
      tempCoeffPmax: 0,
      systemDerate: 0.5,
    });
    const full = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5,
      summerPsh: 5,
      latitude: 0,
      tempCoeffPmax: 0,
      systemDerate: 1,
    });
    expect(half.annualKwh).toBeCloseTo(full.annualKwh / 2, 2);
  });

  it('clamps an out-of-range system derate', () => {
    const result = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5,
      summerPsh: 5,
      tempCoeffPmax: 0,
      systemDerate: 1.5,
    });
    expect(result.systemDerate).toBe(1);
  });

  it('labels months with short names', () => {
    expect(monthLabel(1)).toBe('Jan');
    expect(monthLabel(12)).toBe('Dec');
  });

  it('applies a shading derate to the monthly irradiance', () => {
    const clean = estimateProduction({
      arrayWatts: 3000,
      winterPsh: 4,
      summerPsh: 6,
      latitude: 25,
      tempCoeffPmax: -0.35,
      systemDerate: 0.75,
      tilt: 35,
      azimuth: 180,
    });
    const shaded = estimateProduction({
      arrayWatts: 3000,
      winterPsh: 4,
      summerPsh: 6,
      latitude: 25,
      tempCoeffPmax: -0.35,
      systemDerate: 0.75,
      tilt: 35,
      azimuth: 180,
      shadingFactor: 0.85,
    });
    expect(shaded.shadingFactor).toBe(0.85);
    expect(shaded.annualKwh).toBeCloseTo(clean.annualKwh * 0.85, 1);
    expect(shaded.months[5].energyKwh).toBeCloseTo(clean.months[5].energyKwh * 0.85, 1);
  });

  it('uses a stored monthly PSH profile directly instead of the synth curve', () => {
    const profile = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const result = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 2,
      summerPsh: 6,
      latitude: 30,
      tempCoeffPmax: 0,
      systemDerate: 1,
      monthlyPsh: profile,
    });
    // Each month's PSH matches the stored profile exactly.
    result.months.forEach((m, i) => expect(m.psh).toBe(profile[i]));
    // January is far lower than the winter anchor would have produced.
    expect(result.months[0].psh).toBe(1);
    expect(result.months[0].psh).toBeLessThan(2);
    expect(result.months[11].psh).toBe(12);
    const ideal = profile.reduce((sum, psh, i) => sum + psh * result.months[i].daysInMonth, 0);
    expect(result.annualKwh).toBeCloseTo(ideal, 1);
  });

  it('honours a monsoon-inverted profile (worst month mid-year)', () => {
    const monsoon = [5.1, 5.3, 5.4, 4.9, 4.2, 3.4, 3.1, 3.3, 3.9, 4.6, 5.0, 5.2];
    const result = estimateProduction({
      arrayWatts: 1000,
      winterPsh: 5.1,
      summerPsh: 3.5,
      latitude: 19,
      tempCoeffPmax: 0,
      systemDerate: 1,
      monthlyPsh: monsoon,
    });
    const worst = result.months.reduce((a, b) => (b.psh < a.psh ? b : a));
    expect(worst.month).toBe(7);
    expect(worst.psh).toBe(3.1);
  });
});
