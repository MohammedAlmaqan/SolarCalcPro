import {
  calculateBatteryCapacitySeparate,
  calculateCableSize,
  calculateFromMonthly,
  calculateFromRooftop,
  calculateInverterSize,
  calculateSolarPanels,
  calculateSystem,
} from '../calculator';
import type { CalculateSystemLabels, MonthlyEstimate } from '../calculator';
import type { SystemInput } from '../types';

const LABELS: CalculateSystemLabels = {
  modeNames: { detailed: 'Detailed', monthly: 'Monthly', rooftop: 'Rooftop' },
  dayWord: 'day',
  nightWord: 'night',
  phaseSingle: 'single',
  phaseThree: 'three',
  typeLifepo4: 'LiFePO4',
  typeLithium: 'Lithium',
  typeLeadAcid: 'Lead-Acid',
  cyclesLifepo4: '6000+ cycles',
  cyclesLithium: '3000-5000 cycles',
  cyclesLeadAcid: '500-1000 cycles',
  detailLabels: {
    totalEnergy: 'Total energy',
    dayEnergy: 'Day energy',
    nightEnergy: 'Night energy',
    distribution: 'Distribution',
    peakLoad: 'Peak load',
    surgeLoad: 'Surge load',
    systemLoss: 'System loss',
    sunHours: 'Sun hours',
    inputMode: 'Input mode',
    totalEnergyDesc: '',
    dayEnergyDesc: '',
    nightEnergyDesc: '',
    distributionDesc: '',
    peakLoadDesc: '',
    surgeLoadDesc: '',
    systemLossDesc: '',
    sunHoursDesc: '',
    inputModeDesc: '',
  },
  currentLabels: {
    battery: 'Battery',
    solar: 'Solar',
    load: 'Load',
    breakerBattery: 'B32',
    breakerSolar: 'S25',
    breakerLoad: 'L63',
  },
};

describe('calculateFromMonthly', () => {
  it('splits monthly consumption into daily day/night parts', () => {
    const normal = calculateFromMonthly(600, 'normal');
    expect(normal.total).toBe(20);
    expect(normal.day).toBe(10);
    expect(normal.night).toBe(10);
  });

  it.each<[keyof typeof import('../constants').MONTHLY_PATTERNS, number, number]>([
    ['day', 14, 6],
    ['night', 6, 14],
    ['balanced', 12, 8],
  ])('applies %s pattern', (pattern, day, night) => {
    const result = calculateFromMonthly(600, pattern);
    expect(result.day).toBe(day);
    expect(result.night).toBe(night);
  });

  it('defaults to normal pattern when omitted', () => {
    const result: MonthlyEstimate = calculateFromMonthly(900);
    expect(result).toEqual({ total: 30, day: 15, night: 15 });
  });
});

describe('calculateFromRooftop', () => {
  it('computes max power and panel count from area', () => {
    const result = calculateFromRooftop(100, 'south', '20', 'standard');
    expect(result.maxPower).toBe(15);
    expect(result.panelCount).toBe(37);
    expect(result.actualPower).toBe(14.8);
  });

  it('reduces output for poor orientation', () => {
    const result = calculateFromRooftop(100, 'west', '35', 'standard');
    expect(result.maxPower).toBeCloseTo(11.48, 1);
  });
});

describe('calculateInverterSize', () => {
  it('rounds up to standard size with a 25% margin', () => {
    const result = calculateInverterSize(2000, 5000, 48);
    expect(result.size).toBe(3000);
    expect(result.phase).toBe('single');
  });

  it('respects minimum size for 12V systems', () => {
    const result = calculateInverterSize(100, 100, 12);
    expect(result.size).toBe(500);
  });

  it('selects three-phase for large systems', () => {
    const result = calculateInverterSize(9000, 20000, 96);
    expect(result.size).toBe(12000);
    expect(result.phase).toBe('three');
  });
});

describe('calculateBatteryCapacitySeparate', () => {
  it('sizes the battery from night energy only', () => {
    const result = calculateBatteryCapacitySeparate(5, 10, 0.8, 'lifepo4', 1, 48);
    expect(result.kwh).toBeCloseTo(12.76, 1);
    expect(result.ah).toBe(266);
  });

  it('multiplies by autonomy days', () => {
    const result = calculateBatteryCapacitySeparate(5, 10, 0.8, 'lifepo4', 2, 48);
    expect(result.kwh).toBeCloseTo(25.51, 1);
    expect(result.ah).toBe(532);
  });
});

describe('calculateSolarPanels', () => {
  it('counts 400W panels and groups into strings', () => {
    const result = calculateSolarPanels(40, 5.5, 48);
    expect(result.count).toBe(24);
    expect(result.strings).toBe(3);
    expect(result.panelsPerString).toBe(8);
    expect(result.stringVoltage).toBe(320);
    expect(result.power).toBe(9.6);
  });

  it('uses a single string for small systems', () => {
    const result = calculateSolarPanels(10, 5.5, 48);
    expect(result.count).toBe(6);
    expect(result.strings).toBe(1);
  });
});

describe('calculateCableSize', () => {
  it('selects a standard cross-section for 3% voltage drop', () => {
    const result = calculateCableSize(62.5, 10, 48);
    expect(result).toBe('16 mm2');
  });

  it('uses copper resistivity', () => {
    const result = calculateCableSize(41.67, 5, 48);
    expect(result).toBe('6 mm2');
  });
});

describe('calculateSystem', () => {
  it('sizes the battery from night energy only and sizes inverter from peak load', () => {
    const input: SystemInput = {
      mode: 'detailed',
      settings: {
        region: 'moderate',
        sunHours: 5.5,
        systemLoss: 20,
        systemVoltage: 48,
        batteryType: 'lifepo4',
        dod: 80,
        expandFuture: false,
        backupDaysEnabled: false,
        backupDaysCount: 1,
      },
      monthly: { consumption: 500, kwhPrice: 0.5, pattern: 'normal' },
      rooftop: { area: 20, direction: 'south', angle: '20', panelEfficiency: 'standard' },
      appliances: [
        {
          id: 'a1',
          name: 'TV',
          power: 120,
          quantity: 2,
          dayHours: 5,
          nightHours: 3,
          type: 'electronics',
        },
      ],
    };

    const result = calculateSystem(input, LABELS);

    expect(result.energyDay).toBeCloseTo(1.44, 2);
    expect(result.energyNight).toBeCloseTo(0.86, 2);
    expect(result.peakPower).toBe(168);

    expect(result.inverter.size).toBe(2000);
    expect(result.inverter.phase).toBe('single');

    expect(result.battery.kwh).toBeCloseTo(1.1, 1);
    expect(result.battery.ah).toBe(23);

    expect(result.solar.count).toBe(2);
    expect(result.solar.strings).toBe(1);

    expect(result.autonomy).toBeCloseTo(0.94, 1);
  });

  it('applies expansion and backup-day margins', () => {
    const input: SystemInput = {
      mode: 'detailed',
      settings: {
        region: 'moderate',
        sunHours: 5.5,
        systemLoss: 20,
        systemVoltage: 48,
        batteryType: 'lifepo4',
        dod: 80,
        expandFuture: true,
        backupDaysEnabled: true,
        backupDaysCount: 2,
      },
      monthly: { consumption: 500, kwhPrice: 0.5, pattern: 'normal' },
      rooftop: { area: 20, direction: 'south', angle: '20', panelEfficiency: 'standard' },
      appliances: [
        {
          id: 'a1',
          name: 'TV',
          power: 120,
          quantity: 2,
          dayHours: 5,
          nightHours: 3,
          type: 'electronics',
        },
      ],
    };

    const result = calculateSystem(input, LABELS);
    const baseNight = 0.72 * 1.2 * 1.2 * 3;
    expect(result.energyNight).toBeCloseTo(baseNight, 2);
    expect(result.battery.ah).toBe(248);
  });

  it('handles monthly mode estimates', () => {
    const input: SystemInput = {
      mode: 'monthly',
      settings: {
        region: 'moderate',
        sunHours: 5.5,
        systemLoss: 20,
        systemVoltage: 48,
        batteryType: 'lifepo4',
        dod: 80,
        expandFuture: false,
        backupDaysEnabled: false,
        backupDaysCount: 1,
      },
      monthly: { consumption: 600, kwhPrice: 0.5, pattern: 'normal' },
      rooftop: { area: 20, direction: 'south', angle: '20', panelEfficiency: 'standard' },
      appliances: [],
    };

    const result = calculateSystem(input, LABELS);
    expect(result.mode).toBe('monthly');
    expect(result.energyDay).toBeCloseTo(12, 1);
    expect(result.energyNight).toBeCloseTo(12, 1);
    expect(result.applianceCount).toBe(10);
  });
});
