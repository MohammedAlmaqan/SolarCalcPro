import type { BatteryChemistry, DesignResult } from '../types';

/**
 * Material pricing model used for cost estimates. Defaults are realistic
 * street prices (USD, 2026) and can be overridden per market via
 * {@link estimateCost} options — the engine stays free of any hard-coded
 * currency by defaulting to USD.
 */
export interface PriceBook {
  /** PV modules — price per rated STC watt. */
  panelDollarsPerWatt: number;
  /** Inverter fixed base price, plus a per-continuous-watt charge. */
  inverterFixed: number;
  inverterDollarsPerWatt: number;
  /** Battery price per kWh of capacity, by chemistry. */
  batteryDollarsPerKwh: Record<BatteryChemistry, number>;
  /** Charge controller fixed price by type. */
  controllerMpptFixed: number;
  controllerPwmFixed: number;
  /** Cabling price per meter of one conductor per mm². */
  cableDollarsPerMeterPerMm2: number;
  /** Fixed allowance for breakers, isolators, SPD, busbar & lugs. */
  protectionFixed: number;
  /** Balance-of-system (racking, mounts, conduit, misc) as a fraction of equipment. */
  bosPct: number;
  /** Installation & labor as a fraction of equipment. */
  laborPct: number;
}

export const DEFAULT_PRICE_BOOK: PriceBook = {
  panelDollarsPerWatt: 0.35,
  inverterFixed: 180,
  inverterDollarsPerWatt: 0.28,
  batteryDollarsPerKwh: { lifepo4: 220, 'agm-gel': 160, flooded: 120 },
  controllerMpptFixed: 180,
  controllerPwmFixed: 60,
  cableDollarsPerMeterPerMm2: 0.9,
  protectionFixed: 120,
  bosPct: 0.12,
  laborPct: 0.15,
};

export interface CostLineItem {
  id: string;
  category: string;
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface CostEstimate {
  currency: string;
  lines: CostLineItem[];
  equipmentSubtotal: number;
  bosTotal: number;
  laborTotal: number;
  total: number;
  /** Estimated annual PV production (kWh/yr) used for the payback. */
  annualProductionKwh: number;
  /** Annual energy value at the electric rate (currency/yr). */
  annualSavings: number;
  /** Total / annual savings; null when the rate is zero. */
  simplePaybackYears: number | null;
  assumptions: string[];
}

const money = (value: number): number => Math.round(value * 100) / 100;

function line(
  id: string,
  category: string,
  label: string,
  quantity: number,
  unit: string,
  unitPrice: number,
): CostLineItem {
  return { id, category, label, quantity, unit, unitPrice, total: money(quantity * unitPrice) };
}

/**
 * Build a cost & payback estimate from a design result.
 *
 * Quantities are derived from the sized design (panel count, battery count,
 * conductor runs), so the estimate always reflects the actual configured
 * system — no separate bill-of-materials input required.
 */
export function estimateCost(
  result: DesignResult,
  options?: {
    priceBook?: Partial<PriceBook>;
    /** Grid electric rate used for the payback, default 0.15 currency/kWh. */
    electricRate?: number;
    /** Currency symbol for the estimate, default '$'. */
    currency?: string;
  },
): CostEstimate {
  const book: PriceBook = { ...DEFAULT_PRICE_BOOK, ...options?.priceBook };
  const electricRate = options?.electricRate ?? 0.15;
  const currency = options?.currency ?? '$';
  const { input, pv, battery, inverter, controller, cables } = result;
  const isOnGrid = input.systemType === 'on-grid';

  const lines: CostLineItem[] = [];

  if (pv.totalPanelCount > 0) {
    const wattsPerPanel = pv.actualArrayWatts / pv.totalPanelCount;
    lines.push(
      line(
        'pv-modules',
        'PV modules',
        'PV modules',
        pv.totalPanelCount,
        'pcs',
        money(wattsPerPanel * book.panelDollarsPerWatt),
      ),
    );
  }

  const inverterWatts = inverter.selectedContinuousWatts ?? inverter.recommendedContinuousWatts;
  lines.push(
    line(
      'inverter',
      'Inverter',
      'Inverter',
      1,
      'pcs',
      money(book.inverterFixed + inverterWatts * book.inverterDollarsPerWatt),
    ),
  );

  if (!isOnGrid && battery.batteryCount > 0) {
    const kwhPerBattery = battery.actualCapacityKwh / battery.batteryCount;
    lines.push(
      line(
        'batteries',
        'Battery bank',
        'Battery bank',
        battery.batteryCount,
        'pcs',
        money(kwhPerBattery * book.batteryDollarsPerKwh[input.chemistry]),
      ),
    );
  }

  if (input.systemType === 'off-grid' && controller.minCurrentA > 0) {
    const unit =
      controller.recommendedType === 'MPPT' ? book.controllerMpptFixed : book.controllerPwmFixed;
    lines.push(line('controller', 'Charge controller', 'Charge controller', 1, 'pcs', money(unit)));
  }

  const cableLine = (
    id: string,
    label: string,
    oneWayMeters: number,
    crossSectionMm2: number,
  ): void => {
    const unitPrice = money(crossSectionMm2 * book.cableDollarsPerMeterPerMm2);
    lines.push(line(id, 'Cables', label, money(2 * oneWayMeters), 'm', unitPrice));
  };
  cableLine('cable-pv', 'PV source cable', input.pvCableLengthM ?? 10, cables.pvSource.crossSectionMm2);
  if (!isOnGrid) {
    cableLine('cable-dc', 'DC output cable', input.dcCableLengthM ?? 2, cables.dcOutput.crossSectionMm2);
  }
  cableLine('cable-ac', 'AC output cable', input.acCableLengthM ?? 10, cables.acOutput.crossSectionMm2);

  lines.push(
    line('protection', 'Protection', 'Protection & disconnects', 1, 'kit', money(book.protectionFixed)),
  );

  const equipmentSubtotal = money(lines.reduce((sum, item) => sum + item.total, 0));
  const bosTotal = money(equipmentSubtotal * book.bosPct);
  const laborTotal = money(equipmentSubtotal * book.laborPct);
  const total = money(equipmentSubtotal + bosTotal + laborTotal);

  const avgPsh = (input.winterPsh + input.summerPsh) / 2;
  const performanceRatio = input.systemLossFactor ?? 0.75;
  const annualProductionKwh = money((pv.actualArrayWatts * avgPsh * 365 * performanceRatio) / 1000);
  const annualSavings = money(annualProductionKwh * electricRate);
  const simplePaybackYears = annualSavings > 0 ? money(total / annualSavings) : null;

  const assumptions = [
    `Solar yield modeled at ${Math.round(performanceRatio * 100)}% system performance ratio over ${avgPsh} peak sun hours/day.`,
    `BOS allowance ${Math.round(book.bosPct * 100)}% and installation ${Math.round(book.laborPct * 100)}% of equipment.`,
    `Payback vs grid electricity at ${currency}${electricRate.toFixed(2)}/kWh — savings are annual yield × rate.`,
    'Cable runs counted as 2× one-way length; prices scale with conductor cross-section.',
  ];

  return {
    currency,
    lines,
    equipmentSubtotal,
    bosTotal,
    laborTotal,
    total,
    annualProductionKwh,
    annualSavings,
    simplePaybackYears,
    assumptions,
  };
}
