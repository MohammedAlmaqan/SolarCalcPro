import { AuditTrail } from '../audit';
import { sizeGenerator } from '../formulas/generator';

describe('generator sizing', () => {
  it('sizes a charger to recharge the cycled battery energy within the window', () => {
    const result = sizeGenerator(
      {
        peakSimultaneousWatts: 2000,
        dailyEnergyKwh: 8,
        batteryCapacityKwh: 10,
        depthOfDischarge: 0.8,
      },
      new AuditTrail(),
    );
    expect(result.requiredChargerKw).toBeCloseTo(2, 0);
    expect(result.recommendedKw).toBeGreaterThanOrEqual(result.requiredChargerKw * 1.25);
    expect(result.dailyFuelL).toBeCloseTo(2.4, 1);
  });

  it('covers the peak load when it exceeds the charger rating', () => {
    const result = sizeGenerator(
      {
        peakSimultaneousWatts: 5000,
        dailyEnergyKwh: 6,
        batteryCapacityKwh: 5,
        depthOfDischarge: 0.5,
      },
      new AuditTrail(),
    );
    expect(result.recommendedKw).toBeGreaterThanOrEqual(6.25);
  });

  it('computes an annual fuel cost when a fuel price is given', () => {
    const result = sizeGenerator(
      {
        peakSimultaneousWatts: 3000,
        dailyEnergyKwh: 10,
        batteryCapacityKwh: 15,
        depthOfDischarge: 0.8,
        fuelPricePerL: 1.1,
      },
      new AuditTrail(),
    );
    expect(result.annualFuelL).toBeCloseTo(10 * 0.3 * 365, 0);
    expect(result.annualFuelCost).toBe(1205);
  });
});
