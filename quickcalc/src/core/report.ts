import type { CalculationResult } from './types';
import type { AppStrings } from '@/i18n/strings';

export function buildReportText(result: CalculationResult, t: AppStrings): string {
  const modeName =
    result.mode === 'detailed'
      ? t.modeDetailedName
      : result.mode === 'monthly'
        ? t.modeMonthlyName
        : t.modeRooftopName;

  const lines: string[] = [];
  lines.push('='.repeat(48));
  lines.push(`  ${t.export.title}`);
  lines.push(`  ${t.appTitle}`);
  lines.push('='.repeat(48));
  lines.push('');
  lines.push(`${t.export.date} ${new Date().toLocaleString()}`);
  lines.push(`${t.export.inputMethod} ${modeName}`);
  lines.push(`${t.reportSystemVoltage} ${result.inverter.systemVoltage}V`);
  lines.push(`${t.reportSessionId} ${result.sessionId}`);
  lines.push(`${t.reportVersion} ${result.version}`);
  lines.push('');

  lines.push(`--- ${t.export.statsTitle} ---`);
  lines.push(`${t.export.energyDaily} ${result.energy} kWh`);
  lines.push(`${t.export.energyDay} ${result.energyDay} kWh`);
  lines.push(`${t.export.energyNight} ${result.energyNight} kWh`);
  lines.push(`${t.export.peakLoad} ${result.peakPower} W`);
  lines.push(`${t.export.surgeLoad} ${result.surgePower} W`);
  lines.push(`${t.export.autonomy} ${result.autonomy} ${t.statAutonomy}`);
  lines.push('');

  lines.push(`--- ${t.export.componentsTitle} ---`);
  lines.push(`${t.export.inverter} ${result.inverter.size} W (${result.inverter.phase})`);
  lines.push(`${t.export.batteries} ${result.battery.kwh} kWh / ${result.battery.ah} Ah`);
  lines.push(
    `${t.export.solar} ${result.solar.count} x ${result.solar.panelWattage} W (${result.solar.power} kW)`,
  );
  lines.push('');

  lines.push(`--- ${t.export.detailsTitle} ---`);
  for (const row of result.details) {
    lines.push(`${row.label}: ${row.value}`);
  }
  lines.push('');
  lines.push('-'.repeat(48));
  lines.push(t.importantNote);
  lines.push('='.repeat(48));

  return lines.join('\n');
}
