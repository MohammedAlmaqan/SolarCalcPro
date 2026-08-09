import { REFERENCE_PANEL } from '../core/data/referenceComponents';
import type { DesignResult } from '../core/types';

export type SldNodeType = 'source' | 'protection' | 'converter' | 'storage' | 'load' | 'grid';

export interface SldNode {
  id: string;
  type: SldNodeType;
  label: string;
  sublabel: string;
  /** Extra specifications shown when a node is tapped. */
  detail: string[];
  /** True when the node fails a compliance check. */
  flagged?: boolean;
  flaggedReason?: string;
  x: number;
  y: number;
}

export interface SldEdge {
  id: string;
  from: string;
  to: string;
  dashed?: boolean;
}

export interface SldDiagram {
  width: number;
  height: number;
  nodes: SldNode[];
  edges: SldEdge[];
}

const NODE_W = 150;
const NODE_H = 60;
const GAP = 56;
const CHAIN_Y = 84;
const BRANCH_Y = 236;

/** Build a single-line diagram layout from a completed design. Pure TS. */
export function buildSldDiagram(result: DesignResult): SldDiagram {
  const { input, pv, inverter, controller, protection, compliance, dailyLoad } = result;
  const isOnGrid = input.systemType === 'on-grid';
  const isOffGrid = input.systemType === 'off-grid';
  const panel = input.selected?.panel ?? REFERENCE_PANEL;
  const hasBatteryDischargeIssue = result.warnings.some((w) => w.code === 'BATTERY-DISCHARGE');

  const chain: SldNode[] = [];
  const edges: SldEdge[] = [];
  const batteryNode = isOnGrid ? null : createBatteryNode(result, hasBatteryDischargeIssue);

  // 1. PV array source
  chain.push({
    id: 'pv',
    type: 'source',
    label: 'PV array',
    sublabel: `${pv.seriesCount}S × ${pv.parallelCount}P · ${pv.actualArrayWatts} W`,
    detail: [
      `${pv.actualArrayWatts} W total array`,
      `String ${pv.seriesCount}S × ${pv.parallelCount}P`,
      `Vmp ${pv.arrayVmpV} V · Voc ${pv.arrayVocV} V`,
      `Isc ${pv.arrayIscA} A · Imp ${pv.arrayImpA} A`,
    ],
    flagged: !compliance.arrayVocWithinInverterLimit || !pv.fitsInverterLimits,
    flaggedReason: !compliance.arrayVocWithinInverterLimit
      ? 'Cold array Voc exceeds the MPPT maximum voltage limit.'
      : 'String configuration could not fit within MPPT limits.',
    x: 0,
    y: CHAIN_Y,
  });

  // 2. PV source OCPD
  chain.push({
    id: 'pv-ocpd',
    type: 'protection',
    label: 'PV OCPD',
    sublabel: `${protection.pvSourceOcpdStandardA} A`,
    detail: [
      `OCPD rating ${protection.pvSourceOcpdStandardA} A`,
      `Panel max series fuse ${panel.maxSeriesFuseRating} A`,
    ],
    flagged: !compliance.pvOcpdWithinSeriesFuse,
    flaggedReason: 'OCPD rating exceeds the panel maximum series fuse rating.',
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({ id: 'e-pv-ocpd', from: 'pv', to: 'pv-ocpd' });

  // 3. DC isolator switch
  chain.push({
    id: 'dc-isolator',
    type: 'protection',
    label: 'DC isolator',
    sublabel: protection.dcIsolatorRequired ? 'required' : 'optional',
    detail: ['DC isolating switch for maintenance and emergency disconnection.'],
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({ id: 'e-ocpd-isolator', from: 'pv-ocpd', to: 'dc-isolator' });

  // 4. Charge controller (off-grid) — hybrid/on-grid skip to inverter
  if (isOffGrid) {
    chain.push({
      id: 'controller',
      type: 'converter',
      label: 'Charge controller',
      sublabel: `${controller.recommendedType} · ${controller.selectedCurrentA ?? controller.minCurrentA} A`,
      detail: [
        `${controller.recommendedType} controller`,
        `Rated ${controller.selectedCurrentA ?? controller.minCurrentA} A`,
        `Required ${controller.minCurrentA} A · max PV ${controller.maxPvVoltageRequiredV} V`,
      ],
      flagged: !compliance.controllerCurrentWithinLimit,
      flaggedReason: 'Array short-circuit current exceeds the controller rating.',
      x: 0,
      y: CHAIN_Y,
    });
    edges.push({ id: 'e-isolator-controller', from: 'dc-isolator', to: 'controller' });
  }

  // 5. SPD (DC side for storage systems)
  chain.push({
    id: 'spd',
    type: 'protection',
    label: 'SPD',
    sublabel: protection.spdType,
    detail: [`${protection.spdType} surge protection device.`],
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({
    id: isOffGrid ? 'e-controller-spd' : 'e-isolator-spd',
    from: isOffGrid ? 'controller' : 'dc-isolator',
    to: 'spd',
  });

  // 6. Inverter
  chain.push({
    id: 'inverter',
    type: 'converter',
    label: isOnGrid ? 'Grid inverter' : 'Inverter',
    sublabel: `${inverter.selectedContinuousWatts ?? inverter.recommendedContinuousWatts} W · ${inverter.recommendedType}`,
    detail: [
      `Continuous ${inverter.selectedContinuousWatts ?? inverter.recommendedContinuousWatts} W`,
      `Surge ${inverter.recommendedSurgeWatts} W`,
      `Recommended ${inverter.recommendedType} · ${inverter.recommendedBatteryVoltageV ?? 'grid-tie'} V DC input`,
    ],
    flagged: !compliance.inverterPowerSufficient || !inverter.voltageMatch,
    flaggedReason: !compliance.inverterPowerSufficient
      ? 'Selected inverter continuous power is below the required rating.'
      : 'Inverter battery voltage does not match the system voltage.',
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({ id: 'e-spd-inverter', from: 'spd', to: 'inverter' });

  // 7. AC breaker
  chain.push({
    id: 'ac-breaker',
    type: 'protection',
    label: 'AC breaker',
    sublabel: `${protection.acBreakerStandardA} A`,
    detail: [
      `Breaker ${protection.acBreakerStandardA} A`,
      `Backfeed rule (120%): ${protection.backfeedPasses ? 'passes' : 'fails'}`,
      `Busbar ${input.busbarRatingA ?? 200} A`,
    ],
    flagged: !protection.backfeedPasses,
    flaggedReason: 'AC backfeed exceeds the main panel 120% busbar rule.',
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({ id: 'e-inverter-breaker', from: 'inverter', to: 'ac-breaker' });

  // 8. AC isolator / disconnect
  if (protection.acIsolatorRequired) {
    chain.push({
      id: 'ac-isolator',
      type: 'protection',
      label: 'AC isolator',
      sublabel: `${protection.acBreakerStandardA} A`,
      detail: ['AC isolating disconnect for the inverter output.'],
      x: 0,
      y: CHAIN_Y,
    });
    edges.push({ id: 'e-breaker-acisolator', from: 'ac-breaker', to: 'ac-isolator' });
  }

  // 9. Loads / main panel
  chain.push({
    id: 'loads',
    type: 'load',
    label: 'Main panel / loads',
    sublabel: `${dailyLoad.peakSimultaneousWatts} W peak`,
    detail: [
      `Peak simultaneous ${dailyLoad.peakSimultaneousWatts} W`,
      `Peak surge ${dailyLoad.peakSurgeWatts} W`,
      `Daily energy ${dailyLoad.totalWhPerDay} Wh/day`,
    ],
    x: 0,
    y: CHAIN_Y,
  });
  edges.push({
    id: protection.acIsolatorRequired ? 'e-acisolator-loads' : 'e-breaker-loads',
    from: protection.acIsolatorRequired ? 'ac-isolator' : 'ac-breaker',
    to: 'loads',
  });

  // 10. Grid connection (on-grid / hybrid) via ATS when required
  if (!isOffGrid) {
    if (protection.atsRequired) {
      chain.push({
        id: 'ats',
        type: 'protection',
        label: 'ATS',
        sublabel: '< 20 ms transfer',
        detail: ['Automatic transfer switch for grid/backup changeover (< 20 ms).'],
        x: 0,
        y: CHAIN_Y,
      });
      edges.push({ id: 'e-loads-ats', from: 'loads', to: 'ats' });
    }
    chain.push({
      id: 'grid',
      type: 'grid',
      label: 'Grid',
      sublabel: 'connection',
      detail: ['Grid interconnection point (net-metered).'],
      x: 0,
      y: CHAIN_Y,
    });
    edges.push({
      id: protection.atsRequired ? 'e-ats-grid' : 'e-loads-grid',
      from: protection.atsRequired ? 'ats' : 'loads',
      to: 'grid',
    });
  }

  // Position the chain horizontally.
  const count = chain.length;
  const width = count * NODE_W + (count - 1) * GAP + 2 * GAP;
  chain.forEach((node, index) => {
    node.x = GAP + index * (NODE_W + GAP);
  });

  // Battery branch below the inverter (off-grid / hybrid).
  const nodes: SldNode[] = [...chain];
  if (batteryNode) {
    const inverterIndex = chain.findIndex((n) => n.id === 'inverter');
    batteryNode.x = chain[inverterIndex].x;
    batteryNode.y = BRANCH_Y;
    nodes.push(batteryNode);
    edges.push({
      id: 'e-inverter-battery',
      from: 'inverter',
      to: batteryNode.id,
      dashed: true,
    });
  }

  return {
    width,
    height: BRANCH_Y + NODE_H + GAP,
    nodes,
    edges,
  };
}

function createBatteryNode(result: DesignResult, hasDischargeIssue: boolean): SldNode {
  const { battery } = result;
  return {
    id: 'battery',
    type: 'storage',
    label: 'Battery bank',
    sublabel: `${battery.batteryCount} cells · ${battery.actualCapacityAh} Ah @ ${battery.systemVoltageV} V`,
    detail: [
      `${battery.batteryCount} cells · ${battery.seriesCount}S × ${battery.parallelCount}P`,
      `${battery.actualCapacityAh} Ah · ${battery.actualCapacityKwh} kWh`,
      `DoD ${Math.round(battery.depthOfDischarge * 100)}%`,
      `Required ${battery.requiredKwh} kWh`,
    ],
    flagged: hasDischargeIssue,
    flaggedReason: 'Battery bank max discharge current may be below the inverter DC input current.',
    x: 0,
    y: BRANCH_Y,
  };
}
