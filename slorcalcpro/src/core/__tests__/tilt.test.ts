import {
  annualOptimalTilt,
  monthlyTiltFactor,
  noonSolarAltitudeDeg,
  orientationFactors,
  solarDeclinationDeg,
} from '../formulas/tilt';
import { estimateProduction } from '../formulas/production';

describe('solarDeclinationDeg — mid-month declination', () => {
  it('is positive in northern summer and negative in northern winter', () => {
    expect(solarDeclinationDeg(6)).toBeCloseTo(23.09, 1);
    expect(solarDeclinationDeg(12)).toBeCloseTo(-23.05, 1);
  });

  it('is near zero around the equinox months', () => {
    expect(Math.abs(solarDeclinationDeg(3))).toBeLessThan(3);
    expect(Math.abs(solarDeclinationDeg(9))).toBeLessThan(3);
  });

  it('wraps invalid months into the 1–12 range', () => {
    expect(solarDeclinationDeg(0)).toBeCloseTo(solarDeclinationDeg(12), 6);
    expect(solarDeclinationDeg(13)).toBeCloseTo(solarDeclinationDeg(1), 6);
  });
});

describe('noonSolarAltitudeDeg', () => {
  it('has the sun directly overhead at the equator on the equinox', () => {
    expect(noonSolarAltitudeDeg(0, 0)).toBeCloseTo(90, 6);
  });

  it('rises to 90 − |lat − decl| near the summer solstice', () => {
    expect(noonSolarAltitudeDeg(25, 23.09)).toBeCloseTo(88.09, 1);
  });

  it('drops to a low winter noon for high latitudes', () => {
    expect(noonSolarAltitudeDeg(60, -23.05)).toBeCloseTo(6.95, 1);
  });
});

describe('annualOptimalTilt — rule of thumb', () => {
  it('uses 0.92×|latitude| for annual yield', () => {
    expect(annualOptimalTilt(25)).toBe(23);
    expect(annualOptimalTilt(10)).toBe(9);
  });

  it('adds 10° for winter-priority (battery design month)', () => {
    expect(annualOptimalTilt(25, 'winter')).toBe(35);
    expect(annualOptimalTilt(5, 'winter')).toBe(15);
  });

  it('is symmetric across the equator and clamped to 5–60°', () => {
    expect(annualOptimalTilt(-25, 'winter')).toBe(35);
    expect(annualOptimalTilt(5)).toBe(5);
    expect(annualOptimalTilt(60, 'winter')).toBe(60);
    expect(annualOptimalTilt(65)).toBe(60);
  });
});

describe('monthlyTiltFactor — noon beam model', () => {
  it('is exactly 1 for a flat array regardless of azimuth', () => {
    expect(monthlyTiltFactor(25, 0, 180, 6)).toBe(1);
    expect(monthlyTiltFactor(25, 0, 0, 12)).toBe(1);
  });

  it('boosts the low winter sun when tilted toward the equator', () => {
    expect(monthlyTiltFactor(25, 25, 180, 12)).toBeCloseTo(1.376, 2);
  });

  it('penalises an array facing away from the equator in winter', () => {
    expect(monthlyTiltFactor(25, 25, 0, 12)).toBeCloseTo(0.436, 2);
  });

  it('never drops below the diffuse floor', () => {
    const factor = monthlyTiltFactor(80, 60, 0, 12);
    expect(factor).toBeGreaterThanOrEqual(0.1);
    expect(factor).toBeLessThanOrEqual(1.5);
  });
});

describe('orientationFactors', () => {
  it('reports the equator-facing offset correctly per hemisphere', () => {
    expect(orientationFactors(25, 25, 180).azimuthFromEquator).toBe(0);
    expect(orientationFactors(25, 25, 0).azimuthFromEquator).toBe(180);
    expect(orientationFactors(-30, 25, 0).azimuthFromEquator).toBe(0);
    expect(orientationFactors(-30, 25, 180).azimuthFromEquator).toBe(180);
  });

  it('recommends the winter-priority tilt for the latitude', () => {
    expect(orientationFactors(25, 25, 180).optimalTilt).toBe(35);
  });

  it('annual factor is the mean of the monthly factors', () => {
    const f = orientationFactors(25, 35, 180);
    const mean = f.monthly.reduce((sum, x) => sum + x, 0) / 12;
    expect(f.annual).toBeCloseTo(mean, 3);
  });
});

describe('estimateProduction with orientation', () => {
  const base = {
    arrayWatts: 3000,
    winterPsh: 4,
    summerPsh: 6,
    latitude: 25,
    tempCoeffPmax: -0.35,
    systemDerate: 0.75,
  };

  it('keeps the horizontal curve when the array is flat (factor 1)', () => {
    const plain = estimateProduction(base);
    const flat = estimateProduction({ ...base, tilt: 0, azimuth: 180 });
    expect(flat.orientation?.annualFactor).toBe(1);
    expect(flat.months.map((m) => m.psh)).toEqual(plain.months.map((m) => m.psh));
    expect(flat.annualKwh).toBeCloseTo(plain.annualKwh, 2);
  });

  it('boosts the winter months when tilted toward the equator', () => {
    const flat = estimateProduction({ ...base, tilt: 0, azimuth: 180 });
    const tilted = estimateProduction({ ...base, tilt: 35, azimuth: 180 });
    expect(tilted.months[11].energyKwh).toBeGreaterThan(flat.months[11].energyKwh);
    expect(tilted.orientation?.optimalTilt).toBe(35);
    expect(tilted.orientation?.azimuthFromEquator).toBe(0);
  });

  it('reduces yield when facing away from the equator', () => {
    const facingEquator = estimateProduction({ ...base, tilt: 25, azimuth: 180 });
    const facingAway = estimateProduction({ ...base, tilt: 25, azimuth: 0 });
    expect(facingAway.annualKwh).toBeLessThan(facingEquator.annualKwh);
  });
});
