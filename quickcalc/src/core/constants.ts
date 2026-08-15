import type {
  Appliance,
  BatteryType,
  ConsumptionPattern,
  DeviceTypeId,
  MonthlyData,
  PanelEfficiency,
  RooftopData,
  RoofAngle,
  RoofDirection,
  SystemSettings,
  SystemVoltage,
} from './types';

export const APP_VERSION = '2.4.0';

export const CALCULATOR_STANDARD_SIZES = [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000];

export const MIN_INVERTER_SIZE_BY_VOLTAGE: Record<SystemVoltage, number> = {
  12: 500,
  24: 1000,
  48: 2000,
  96: 5000,
};

export const INVERTER_EFFICIENCY_BY_VOLTAGE: Record<SystemVoltage, number> = {
  12: 85,
  24: 90,
  48: 96,
  96: 97,
};

export const CABLE_STANDARD_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

export const COPPER_RESISTIVITY = 0.0178;
export const ALUMINUM_RESISTIVITY = 0.0283;

export const CABLE_LENGTHS = {
  battery: 5,
  solar: 10,
  load: 15,
} as const;

export const VOLTAGE_OPTIONS: SystemVoltage[] = [12, 24, 48, 96];

export const SURGE_FACTORS: Record<DeviceTypeId, number> = {
  resistance: 1.0,
  electronics: 1.2,
  small_motor: 2.5,
  medium_motor: 4.0,
  large_motor: 6.0,
};

export const BATTERY_EFFICIENCIES: Record<BatteryType, number> = {
  lifepo4: 0.98,
  lithium: 0.95,
  lead_acid: 0.85,
};

export const BATTERY_TYPE_NAMES: Record<BatteryType, string> = {
  lifepo4: 'lifepo4',
  lithium: 'lithium',
  lead_acid: 'lead_acid',
};

export const BATTERY_CYCLES: Record<BatteryType, string> = {
  lifepo4: '6000+',
  lithium: '3000-5000',
  lead_acid: '500-1000',
};

export const SUN_HOURS_MAP: Record<SystemSettings['region'], number> = {
  sunny: 6.5,
  moderate: 5.5,
  cloudy: 4.0,
  northern: 4.5,
};

export const MONTHLY_PATTERNS: Record<ConsumptionPattern, { day: number; night: number }> = {
  normal: { day: 0.5, night: 0.5 },
  day: { day: 0.7, night: 0.3 },
  night: { day: 0.3, night: 0.7 },
  balanced: { day: 0.6, night: 0.4 },
};

export const ROOF_DIRECTION_FACTORS: Record<RoofDirection, number> = {
  south: 1.0,
  southeast: 0.95,
  southwest: 0.95,
  east: 0.85,
  west: 0.85,
};

export const ROOF_ANGLE_FACTORS: Record<RoofAngle, number> = {
  '15': 0.95,
  '20': 1.0,
  '25': 0.98,
  '30': 0.95,
  '35': 0.9,
};

export const PANEL_EFFICIENCY_FACTORS: Record<PanelEfficiency, number> = {
  standard: 1.0,
  high: 1.1,
  premium: 1.2,
};

export const ROOFTOP_POWER_PER_M2 = 150;
export const PANEL_WATTAGE = 400;

export const DEFAULT_SETTINGS: SystemSettings = {
  region: 'moderate',
  sunHours: 5.5,
  systemLoss: 20,
  systemVoltage: 24,
  batteryType: 'lifepo4',
  dod: 80,
  expandFuture: true,
  backupDaysEnabled: false,
  backupDaysCount: 1,
};

export const DEFAULT_MONTHLY: MonthlyData = {
  consumption: 500,
  kwhPrice: 0.5,
  pattern: 'normal',
};

export const DEFAULT_ROOFTOP: RooftopData = {
  area: 20,
  direction: 'south',
  angle: '20',
  panelEfficiency: 'standard',
};

export const SAMPLE_APPLIANCES: Omit<Appliance, 'id'>[] = [
  { name: 'LED bulb', power: 20, quantity: 10, dayHours: 4, nightHours: 4, type: 'resistance' },
  { name: 'LED TV', power: 120, quantity: 2, dayHours: 5, nightHours: 3, type: 'electronics' },
  { name: 'Ceiling fan', power: 95, quantity: 3, dayHours: 8, nightHours: 6, type: 'small_motor' },
  { name: 'Modern fridge', power: 150, quantity: 1, dayHours: 8, nightHours: 8, type: 'medium_motor' },
  { name: 'Water pump', power: 350, quantity: 1, dayHours: 0.5, nightHours: 0, type: 'medium_motor' },
  { name: 'Washing machine', power: 450, quantity: 1, dayHours: 1, nightHours: 0, type: 'large_motor' },
  { name: 'Internet router', power: 15, quantity: 1, dayHours: 12, nightHours: 12, type: 'electronics' },
  { name: 'Phone chargers', power: 10, quantity: 4, dayHours: 3, nightHours: 3, type: 'electronics' },
];
