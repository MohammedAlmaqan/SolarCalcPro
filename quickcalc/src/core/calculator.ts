import {
  APP_VERSION,
  BATTERY_EFFICIENCIES,
  CABLE_LENGTHS,
  CABLE_STANDARD_SIZES,
  CALCULATOR_STANDARD_SIZES,
  COPPER_RESISTIVITY,
  INVERTER_EFFICIENCY_BY_VOLTAGE,
  MIN_INVERTER_SIZE_BY_VOLTAGE,
  MONTHLY_PATTERNS,
  PANEL_EFFICIENCY_FACTORS,
  PANEL_WATTAGE,
  ROOF_ANGLE_FACTORS,
  ROOF_DIRECTION_FACTORS,
  ROOFTOP_POWER_PER_M2,
  SURGE_FACTORS,
} from './constants';
import type {
  BatteryResult,
  CalculationResult,
  CurrentRow,
  CurrentsResult,
  DetailRow,
  DeviceTypeId,
  InverterResult,
  PanelEfficiency,
  RoofAngle,
  RoofDirection,
  SolarResult,
  SystemInput,
  SystemVoltage,
} from './types';

export function roundToTwo(value: number): number {
  if (isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function getSurgeFactor(deviceType: DeviceTypeId): number {
  return SURGE_FACTORS[deviceType] ?? 1.0;
}

export interface MonthlyEstimate {
  total: number;
  day: number;
  night: number;
}

export function calculateFromMonthly(
  monthlyKwh: number,
  pattern: keyof typeof MONTHLY_PATTERNS = 'normal',
): MonthlyEstimate {
  const dailyKwh = monthlyKwh / 30;
  const distribution = MONTHLY_PATTERNS[pattern] ?? MONTHLY_PATTERNS.normal;
  return {
    total: roundToTwo(dailyKwh),
    day: roundToTwo(dailyKwh * distribution.day),
    night: roundToTwo(dailyKwh * distribution.night),
  };
}

export interface RooftopEstimate {
  maxPower: number;
  panelCount: number;
  actualPower: number;
  area: number;
}

export function calculateFromRooftop(
  area: number,
  direction: RoofDirection,
  angle: RoofAngle,
  efficiency: PanelEfficiency,
): RooftopEstimate {
  const dirFactor = ROOF_DIRECTION_FACTORS[direction] ?? 1.0;
  const angFactor = ROOF_ANGLE_FACTORS[angle] ?? 1.0;
  const panelFactor = PANEL_EFFICIENCY_FACTORS[efficiency] ?? 1.0;

  const maxPower = area * ROOFTOP_POWER_PER_M2 * dirFactor * angFactor * panelFactor;
  const panelCount = Math.floor(maxPower / PANEL_WATTAGE);
  const actualPower = (panelCount * PANEL_WATTAGE) / 1000;

  return {
    maxPower: roundToTwo(maxPower / 1000),
    panelCount,
    actualPower: roundToTwo(actualPower),
    area,
  };
}

export function calculateInverterSize(
  peakPower: number,
  surgePower: number,
  systemVoltage: SystemVoltage = 48,
): InverterResult {
  let inverterSize = peakPower * 1.25;
  inverterSize = Math.max(inverterSize, surgePower / 2);

  inverterSize = Math.max(inverterSize, MIN_INVERTER_SIZE_BY_VOLTAGE[systemVoltage] ?? 1000);

  let selectedSize = CALCULATOR_STANDARD_SIZES[CALCULATOR_STANDARD_SIZES.length - 1];
  for (const size of CALCULATOR_STANDARD_SIZES) {
    if (size >= inverterSize) {
      selectedSize = size;
      break;
    }
  }

  const efficiency = INVERTER_EFFICIENCY_BY_VOLTAGE[systemVoltage] ?? 95;

  const phase: InverterResult['phase'] =
    selectedSize > 10000 || systemVoltage >= 96 ? 'three' : 'single';

  return {
    size: selectedSize,
    continuousPower: selectedSize,
    surgePower: selectedSize * 2,
    systemVoltage,
    efficiency,
    phase,
  };
}

export function calculateBatteryCapacitySeparate(
  energyDay: number,
  energyNight: number,
  dod: number,
  batteryType: keyof typeof BATTERY_EFFICIENCIES,
  daysAutonomy = 1,
  systemVoltage: SystemVoltage = 48,
): BatteryResult {
  const efficiency = BATTERY_EFFICIENCIES[batteryType] ?? 0.92;

  let capacity = energyNight / (dod * efficiency);
  capacity *= daysAutonomy;

  const ahCapacity = (capacity * 1000) / systemVoltage;

  return {
    kwh: roundToTwo(capacity),
    ah: Math.ceil(ahCapacity),
    voltage: systemVoltage,
    energyDay: roundToTwo(energyDay),
    energyNight: roundToTwo(energyNight),
    type: batteryType,
    dod: 0,
    cycles: '',
    autonomy: 0,
  };
}

export function calculateSolarPanels(
  energy: number,
  sunHours: number,
  _systemVoltage: SystemVoltage = 48,
  _panelEfficiency = 0.2,
  losses = 0.3,
): SolarResult {
  const requiredEnergy = energy * (1 + losses);
  const panelPower = requiredEnergy / sunHours;

  const panelCount = Math.ceil((panelPower * 1000) / PANEL_WATTAGE);
  const actualPowerKW = (panelCount * PANEL_WATTAGE) / 1000;

  let strings = 1;
  if (panelCount > 8) strings = 2;
  if (panelCount > 16) strings = 3;
  if (panelCount > 24) strings = 4;

  const panelsPerString = Math.ceil(panelCount / strings);
  const stringVoltage = panelsPerString * 40;

  return {
    power: roundToTwo(actualPowerKW),
    count: panelCount,
    panelWattage: PANEL_WATTAGE,
    strings,
    panelsPerString,
    stringVoltage,
    type: 'mono',
    efficiency: '>=20%',
  };
}

export function calculateCurrent(power: number, voltage: number): number {
  if (voltage === 0) return 0;
  return roundToTwo(power / voltage);
}

export function calculateCableSize(
  current: number,
  length: number,
  voltage: number,
  material: 'copper' | 'aluminum' = 'copper',
): string {
  const voltageDrop = voltage * 0.03;
  const maxResistance = voltageDrop / current;
  const resistivity = material === 'copper' ? COPPER_RESISTIVITY : 0.0283;
  const crossSection = (resistivity * length * 2) / maxResistance;

  let selectedSize = CABLE_STANDARD_SIZES[CABLE_STANDARD_SIZES.length - 1];
  for (const size of CABLE_STANDARD_SIZES) {
    if (size >= crossSection) {
      selectedSize = size;
      break;
    }
  }

  return `${selectedSize} mm2`;
}

export interface CalculateSystemLabels {
  modeNames: { detailed: string; monthly: string; rooftop: string };
  dayWord: string;
  nightWord: string;
  phaseSingle: string;
  phaseThree: string;
  typeLifepo4: string;
  typeLithium: string;
  typeLeadAcid: string;
  cyclesLifepo4: string;
  cyclesLithium: string;
  cyclesLeadAcid: string;
  detailLabels: {
    totalEnergy: string;
    dayEnergy: string;
    nightEnergy: string;
    distribution: string;
    peakLoad: string;
    surgeLoad: string;
    systemLoss: string;
    sunHours: string;
    inputMode: string;
    totalEnergyDesc: string;
    dayEnergyDesc: string;
    nightEnergyDesc: string;
    distributionDesc: string;
    peakLoadDesc: string;
    surgeLoadDesc: string;
    systemLossDesc: string;
    sunHoursDesc: string;
    inputModeDesc: string;
  };
  currentLabels: {
    battery: string;
    solar: string;
    load: string;
    breakerBattery: string;
    breakerSolar: string;
    breakerLoad: string;
  };
}

export function calculateSystem(input: SystemInput, labels: CalculateSystemLabels): CalculationResult {
  let totalEnergyDay = 0;
  let totalEnergyNight = 0;
  let totalEnergy = 0;
  let totalPower = 0;
  let surgePower = 0;
  let applianceCount = 0;

  const { settings } = input;

  if (input.mode === 'detailed') {
    applianceCount = input.appliances.length;

    for (const app of input.appliances) {
      const surgeFactor = getSurgeFactor(app.type);
      const devicePower = app.power * app.quantity;
      const deviceSurgePower = devicePower * surgeFactor;

      totalPower += devicePower;
      totalEnergyDay += (devicePower * app.dayHours) / 1000;
      totalEnergyNight += (devicePower * app.nightHours) / 1000;
      surgePower += deviceSurgePower;
    }

    totalEnergy = totalEnergyDay + totalEnergyNight;
  } else if (input.mode === 'monthly') {
    const monthly = input.monthly!;
    const daily = calculateFromMonthly(monthly.consumption, monthly.pattern);
    totalEnergyDay = daily.day;
    totalEnergyNight = daily.night;
    totalEnergy = daily.total;

    const peakHours = 6;
    const peakPowerEstimate = (totalEnergy * 0.7 * 1000) / peakHours;
    totalPower = peakPowerEstimate;
    surgePower = peakPowerEstimate * 1.5;

    applianceCount = 10;
  } else {
    const rooftop = input.rooftop!;
    const estimate = calculateFromRooftop(
      rooftop.area,
      rooftop.direction,
      rooftop.angle,
      rooftop.panelEfficiency,
    );

    const sunHours = settings.sunHours || 5.5;
    const estimatedEnergy = roundToTwo(estimate.actualPower * sunHours * 0.75);

    totalEnergyDay = roundToTwo(estimatedEnergy * 0.6);
    totalEnergyNight = roundToTwo(estimatedEnergy * 0.4);
    totalEnergy = estimatedEnergy;

    totalPower = estimate.actualPower * 1000 * 0.8;
    surgePower = totalPower * 1.2;

    applianceCount = 15;
  }

  totalEnergy = roundToTwo(totalEnergy);
  totalEnergyDay = roundToTwo(totalEnergyDay);
  totalEnergyNight = roundToTwo(totalEnergyNight);

  const systemLoss = settings.systemLoss / 100;
  const sunHours = settings.sunHours;
  const batteryType = settings.batteryType;
  const dod = settings.dod / 100;
  const systemVoltage = settings.systemVoltage;
  const expandFuture = settings.expandFuture;
  const backupDaysCount = settings.backupDaysEnabled
    ? settings.backupDaysCount || 1
    : 0;

  let finalEnergyDay = totalEnergyDay * (1 + systemLoss);
  let finalEnergyNight = totalEnergyNight * (1 + systemLoss);

  if (expandFuture) {
    finalEnergyDay *= 1.2;
    finalEnergyNight *= 1.2;
  }

  if (backupDaysCount > 0) {
    finalEnergyDay *= 1 + backupDaysCount;
    finalEnergyNight *= 1 + backupDaysCount;
  }

  finalEnergyDay = roundToTwo(finalEnergyDay);
  finalEnergyNight = roundToTwo(finalEnergyNight);
  const finalEnergy = roundToTwo(finalEnergyDay + finalEnergyNight);

  const realisticPeakPower = totalPower * 0.7;
  const realisticSurgePower = Math.max(surgePower * 0.5, realisticPeakPower * 1.5);

  const inverter = calculateInverterSize(realisticPeakPower, realisticSurgePower, systemVoltage);

  const battery = calculateBatteryCapacitySeparate(
    finalEnergyDay,
    finalEnergyNight,
    dod,
    batteryType,
    backupDaysCount + 1,
    systemVoltage,
  );

  const requiredSolarEnergy = (finalEnergyDay + finalEnergyNight / 0.85) * 1.3;
  const solar = calculateSolarPanels(requiredSolarEnergy, sunHours, systemVoltage);

  const batteryCurrent = calculateCurrent(inverter.size, systemVoltage);
  const solarCurrent = calculateCurrent(solar.power * 1000, systemVoltage);
  const loadCurrent = calculateCurrent(realisticPeakPower, systemVoltage);

  const cableBattery = calculateCableSize(batteryCurrent, CABLE_LENGTHS.battery, systemVoltage);
  const cableSolar = calculateCableSize(solarCurrent, CABLE_LENGTHS.solar, systemVoltage);
  const cableLoad = calculateCableSize(loadCurrent, CABLE_LENGTHS.load, systemVoltage);

  const currents: CurrentsResult = {
    battery: roundToTwo(batteryCurrent),
    solar: roundToTwo(solarCurrent),
    load: roundToTwo(loadCurrent),
    cableBattery,
    cableSolar,
    cableLoad,
  };

  const autonomyDays = roundToTwo((battery.kwh * dod * 0.92) / finalEnergyNight);
  battery.autonomy = autonomyDays;
  battery.type =
    batteryType === 'lifepo4'
      ? labels.typeLifepo4
      : batteryType === 'lithium'
        ? labels.typeLithium
        : labels.typeLeadAcid;
  battery.dod = dod * 100;
  battery.cycles =
    batteryType === 'lifepo4'
      ? labels.cyclesLifepo4
      : batteryType === 'lithium'
        ? labels.cyclesLithium
        : labels.cyclesLeadAcid;

  const total = finalEnergyDay + finalEnergyNight;
  const dayPercentage = total > 0 ? Math.round((finalEnergyDay / total) * 100) : 0;
  const nightPercentage = total > 0 ? Math.round((finalEnergyNight / total) * 100) : 0;

  const modeName =
    input.mode === 'detailed'
      ? labels.modeNames.detailed
      : input.mode === 'monthly'
        ? labels.modeNames.monthly
        : labels.modeNames.rooftop;

  const details: DetailRow[] = [
    {
      label: labels.detailLabels.totalEnergy,
      value: `${roundToTwo(finalEnergy)} kWh`,
      explanation: labels.detailLabels.totalEnergyDesc,
      equationKey: 'totalEnergy',
      actualValue: `${roundToTwo(finalEnergy)} kWh`,
    },
    {
      label: labels.detailLabels.dayEnergy,
      value: `${roundToTwo(finalEnergyDay)} kWh`,
      explanation: labels.detailLabels.dayEnergyDesc,
    },
    {
      label: labels.detailLabels.nightEnergy,
      value: `${roundToTwo(finalEnergyNight)} kWh`,
      explanation: labels.detailLabels.nightEnergyDesc,
    },
    {
      label: labels.detailLabels.distribution,
      value: `${dayPercentage}% ${labels.dayWord}, ${nightPercentage}% ${labels.nightWord}`,
      explanation: labels.detailLabels.distributionDesc,
    },
    {
      label: labels.detailLabels.peakLoad,
      value: `${Math.round(realisticPeakPower)} W`,
      explanation: labels.detailLabels.peakLoadDesc,
      equationKey: 'peakPower',
      actualValue: `${Math.round(realisticPeakPower)} W`,
    },
    {
      label: labels.detailLabels.surgeLoad,
      value: `${Math.round(realisticSurgePower)} W`,
      explanation: labels.detailLabels.surgeLoadDesc,
      equationKey: 'surgePower',
      actualValue: `${Math.round(realisticSurgePower)} W`,
    },
    {
      label: labels.detailLabels.systemLoss,
      value: `${settings.systemLoss}%`,
      explanation: labels.detailLabels.systemLossDesc,
    },
    {
      label: labels.detailLabels.sunHours,
      value: `${sunHours} h/day`,
      explanation: labels.detailLabels.sunHoursDesc,
    },
    {
      label: labels.detailLabels.inputMode,
      value: modeName,
      explanation: labels.detailLabels.inputModeDesc,
    },
  ];

  const currentRows: CurrentRow[] = [
    {
      label: labels.currentLabels.battery,
      value: `${roundToTwo(batteryCurrent)} A`,
      cable: cableBattery,
      breaker: labels.currentLabels.breakerBattery,
      equationKey: 'batteryCurrent',
      actualValue: `${roundToTwo(batteryCurrent)}A`,
    },
    {
      label: labels.currentLabels.solar,
      value: `${roundToTwo(solarCurrent)} A`,
      cable: cableSolar,
      breaker: labels.currentLabels.breakerSolar,
      equationKey: 'solarCurrent',
      actualValue: `${roundToTwo(solarCurrent)}A`,
    },
    {
      label: labels.currentLabels.load,
      value: `${roundToTwo(loadCurrent)} A`,
      cable: cableLoad,
      breaker: labels.currentLabels.breakerLoad,
      equationKey: 'batteryCurrent',
      actualValue: `${roundToTwo(loadCurrent)}A`,
    },
  ];

  return {
    version: APP_VERSION,
    sessionId: Date.now().toString(36),
    mode: input.mode,
    energy: finalEnergy,
    energyDay: finalEnergyDay,
    energyNight: finalEnergyNight,
    dayPercentage,
    nightPercentage,
    peakPower: Math.round(realisticPeakPower),
    surgePower: Math.round(realisticSurgePower),
    autonomy: autonomyDays,
    inverter,
    battery,
    solar,
    currents,
    details,
    currentRows,
    backupDaysCount,
    systemLoss: settings.systemLoss,
    sunHours,
    applianceCount,
  };
}
