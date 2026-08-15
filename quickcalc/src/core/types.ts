import type { EquationKey } from './equations';

export type InputMode = 'detailed' | 'monthly' | 'rooftop';

export type DeviceTypeId =
  | 'resistance'
  | 'electronics'
  | 'small_motor'
  | 'medium_motor'
  | 'large_motor';

export type BatteryType = 'lifepo4' | 'lithium' | 'lead_acid';

export type SystemVoltage = 12 | 24 | 48 | 96;

export type ConsumptionPattern = 'normal' | 'day' | 'night' | 'balanced';

export type RoofDirection = 'south' | 'southeast' | 'southwest' | 'east' | 'west';

export type RoofAngle = '15' | '20' | '25' | '30' | '35';

export type PanelEfficiency = 'standard' | 'high' | 'premium';

export interface Appliance {
  id: string;
  name: string;
  power: number;
  quantity: number;
  dayHours: number;
  nightHours: number;
  type: DeviceTypeId;
}

export interface SystemSettings {
  region: 'sunny' | 'moderate' | 'cloudy' | 'northern';
  sunHours: number;
  systemLoss: number;
  systemVoltage: SystemVoltage;
  batteryType: BatteryType;
  dod: number;
  expandFuture: boolean;
  backupDaysEnabled: boolean;
  backupDaysCount: number;
}

export interface MonthlyData {
  consumption: number;
  kwhPrice: number;
  pattern: ConsumptionPattern;
}

export interface RooftopData {
  area: number;
  direction: RoofDirection;
  angle: RoofAngle;
  panelEfficiency: PanelEfficiency;
}

export interface SystemInput {
  mode: InputMode;
  appliances: Appliance[];
  settings: SystemSettings;
  monthly?: MonthlyData;
  rooftop?: RooftopData;
}

export interface InverterResult {
  size: number;
  continuousPower: number;
  surgePower: number;
  systemVoltage: SystemVoltage;
  efficiency: number;
  phase: 'single' | 'three';
}

export interface BatteryResult {
  kwh: number;
  ah: number;
  voltage: SystemVoltage;
  energyDay: number;
  energyNight: number;
  type: string;
  dod: number;
  cycles: string;
  autonomy: number;
}

export interface SolarResult {
  power: number;
  count: number;
  panelWattage: number;
  strings: number;
  panelsPerString: number;
  stringVoltage: number;
  type: string;
  efficiency: string;
}

export interface CurrentsResult {
  battery: number;
  solar: number;
  load: number;
  cableBattery: string;
  cableSolar: string;
  cableLoad: string;
}

export interface DetailRow {
  label: string;
  value: string;
  explanation: string;
  equationKey?: EquationKey;
  actualValue?: string;
}

export interface CurrentRow {
  label: string;
  value: string;
  cable: string;
  breaker: string;
  equationKey: EquationKey;
  actualValue: string;
}

export interface CalculationResult {
  version: string;
  sessionId: string;
  mode: InputMode;
  energy: number;
  energyDay: number;
  energyNight: number;
  dayPercentage: number;
  nightPercentage: number;
  peakPower: number;
  surgePower: number;
  autonomy: number;
  inverter: InverterResult;
  battery: BatteryResult;
  solar: SolarResult;
  currents: CurrentsResult;
  details: DetailRow[];
  currentRows: CurrentRow[];
  backupDaysCount: number;
  systemLoss: number;
  sunHours: number;
  applianceCount: number;
}

export interface SessionData {
  mode: InputMode;
  settings: SystemSettings;
  appliances: Appliance[];
  monthly?: MonthlyData;
  rooftop?: RooftopData;
}

export interface Session {
  id: number;
  name: string;
  data: SessionData;
}
