import type { CostEstimate } from '../core/formulas/costing';
import type { DesignResult } from '../core/types';
import type { ScenarioRecord } from '../db/repos/projects';
import type { CompanyProfile, UnitSettings } from '../store/settings';
import { createFormatters } from '../utils/format';
import { COMPANY_LOGO_DATA_URI } from './companyLogoDataUri';
import { renderSldHtml } from './pdfTemplate';
import { monthLabel } from '../core/formulas/production';

export interface ProposalData {
  projectName: string;
  clientName: string;
  /** Free-form proposal notes / scope shown on the cover page. */
  notes: string;
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  validityDays: number;
  scenario: ScenarioRecord;
  result: DesignResult;
  cost: CostEstimate;
  profile: CompanyProfile;
  units?: UnitSettings;
}

const DEFAULT_TERMS = [
  'Prices are estimates for planning purposes and should be confirmed against supplier quotes.',
  'Engineering reference data must be verified against manufacturer datasheets before purchase.',
  'Payment terms: 50% advance, balance on installation completion.',
  'System installation and commissioning are included in the labor estimate.',
];

function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Build a structured, page-controlled proposal document (print/PDF ready). */
export function buildProposalPdfHtml(data: ProposalData): string {
  const {
    projectName,
    clientName,
    notes,
    quoteNumber,
    issueDate,
    validUntil,
    scenario,
    result,
    cost,
    profile,
    units,
  } = data;
  const f = createFormatters(units ?? { power: 'w', length: 'm', cable: 'mm2', temp: 'c' });
  const { dailyLoad, pv, battery, inverter, controller, cables, protection } = result;
  const systemVoltage = battery.systemVoltageV;
  const symbol = cost.currency;
  const money = (value: number): string => `${symbol}${f.number(value, 2)}`;

  const loadRows = scenario.loads
    .map(
      (load) => `
      <tr>
        <td>${esc(load.name)}</td>
        <td>${load.quantity}</td>
        <td>${load.powerWatts}</td>
        <td>${load.hoursPerDay}</td>
        <td>${load.isAc ? 'AC' : 'DC'}</td>
        <td class="num">${f.number(load.quantity * load.powerWatts * load.hoursPerDay, 0)}</td>
      </tr>`,
    )
    .join('');

  // Costed bill of materials, grouped by category.
  const categoryRows = cost.lines
    .map(
      (item) => `
      <tr>
        <td>${esc(item.category)}</td>
        <td>${esc(item.label)}</td>
        <td class="num">${f.number(item.quantity, item.quantity < 10 ? 2 : 0)}</td>
        <td>${esc(item.unit)}</td>
        <td class="num">${money(item.unitPrice)}</td>
        <td class="num">${money(item.total)}</td>
      </tr>`,
    )
    .join('');

  const warningRows = result.warnings
    .map(
      (w) => `
      <tr>
        <td class="sev-${w.severity}">${esc(w.severity)}</td>
        <td>${esc(w.message)}</td>
        <td>${esc(w.standard ?? w.code)}</td>
      </tr>`,
    )
    .join('');

  // Page 4: terms + signature
  const logoUri = profile.logoDataUri || COMPANY_LOGO_DATA_URI;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: Roboto, Arial, sans-serif; color: #131c20; margin: 0; font-size: 11px; line-height: 1.45; }
  .page { page-break-before: always; }
  .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f5a623; padding-bottom: 10px; }
  .logo { width: 44px; height: 44px; border-radius: 8px; background: #0b4f6c; color: #fff; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center; }
  .logo-img { height: 44px; width: auto; object-fit: contain; }
  .brand-name { font-size: 18px; font-weight: 800; color: #0b4f6c; }
  .brand-tag { font-size: 10px; color: #555; }
  .contact { font-size: 10px; color: #333; text-align: right; line-height: 1.5; }
  h1 { font-size: 22px; margin: 18px 0 2px; color: #0b4f6c; }
  h2 { font-size: 13px; margin: 18px 0 8px; color: #0b4f6c; border-bottom: 2px solid #f5a623; padding-bottom: 4px; }
  .meta { font-size: 11px; color: #333; margin: 10px 0; }
  .meta td { border: none; padding: 2px 8px 2px 0; vertical-align: top; }
  .meta .lbl { color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #cfd8dd; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #e5edf1; }
  td.num, th.num { text-align: right; }
  .grid { display: flex; flex-wrap: wrap; }
  .grid > div { flex: 1 1 45%; }
  .stat { background: #f2f7f9; border: 1px solid #e0e8ec; border-radius: 6px; padding: 8px; margin: 4px; }
  .stat .lbl { font-size: 9px; color: #555; }
  .stat .val { font-size: 15px; font-weight: 700; color: #0b4f6c; }
  .sev-error { color: #b3261e; font-weight: 700; text-transform: uppercase; }
  .sev-warning { color: #c77d00; font-weight: 700; text-transform: uppercase; }
  .sev-info { color: #1b7f4b; text-transform: uppercase; }
  .sld-table { border: none; }
  .sld-table td { border: none; padding: 3px; text-align: center; }
  .sld { border-radius: 6px; padding: 8px 10px; font-weight: 700; font-size: 9px; color: #fff; }
  .sld.source { background: #0b4f6c; }
  .sld.protect { background: #7d5a1a; }
  .sld.convert { background: #1b7f4b; }
  .sld.load { background: #3f4850; }
  .sld.battery { background: #8d4a9b; }
  .sld.grid { background: #6f7c84; }
  .sld-arrow { font-size: 14px; color: #0b4f6c; }
  .total-row td { font-weight: 800; background: #f6f0e4; }
  .grand-total td { font-weight: 800; background: #0b4f6c; color: #fff; }
  .roi { background: #f2f7f9; border-left: 4px solid #f5a623; padding: 8px 10px; margin: 8px 0; }
  .roi .val { font-size: 16px; font-weight: 800; color: #0b4f6c; }
  .assumptions { font-size: 10px; color: #555; margin-top: 6px; }
  .assumptions li { margin-bottom: 3px; }
  .terms li { margin-bottom: 6px; }
  .signature { margin-top: 32px; display: flex; justify-content: space-between; gap: 24px; }
  .signature .sig { flex: 1; }
  .sig-line { border-top: 1px solid #131c20; margin-top: 46px; padding-top: 4px; font-size: 10px; color: #555; }
  .footer { margin-top: 24px; font-size: 8px; color: #999; border-top: 1px solid #e0e8ec; padding-top: 6px; }
  .cover-box { border: 1px solid #e0e8ec; border-radius: 8px; padding: 14px 16px; margin-top: 20px; background: #fafcfe; }
</style>
</head>
<body>

  <!-- Cover page -->
  <div class="brand">
    <div>
      ${
        logoUri
          ? `<img class="logo-img" src="${logoUri}" alt="${esc(profile.companyName || 'Logo')}" />`
          : `<div class="logo">${esc((profile.companyName || 'S').charAt(0).toUpperCase())}</div>`
      }
      <div class="brand-name">${esc(profile.companyName || 'SlorCalcPro')}</div>
      <div class="brand-tag">${esc(profile.tagline || 'Offline solar system design & engineering')}</div>
    </div>
    <div class="contact">
      ${[profile.engineerName, profile.phone, profile.email, profile.address]
        .filter(Boolean)
        .map((item) => `${esc(item)}<br />`)
        .join('')}
    </div>
  </div>

  <h1>Solar Energy Proposal</h1>
  <table class="meta">
    <tr><td class="lbl">Quote number</td><td><b>${esc(quoteNumber)}</b></td>
        <td class="lbl">Issue date</td><td>${esc(issueDate)}</td></tr>
    <tr><td class="lbl">Project</td><td><b>${esc(projectName)}</b></td>
        <td class="lbl">Valid until</td><td>${esc(validUntil)} (${data.validityDays} days)</td></tr>
    <tr><td class="lbl">Client</td><td>${esc(clientName || '—')}</td>
        <td class="lbl">Prepared by</td><td>${esc(profile.engineerName || profile.companyName || '—')}</td></tr>
    <tr><td class="lbl">Scenario</td><td>${esc(scenario.name)}</td>
        <td class="lbl">System type</td><td>${scenario.systemType} · ${systemVoltage} V</td></tr>
  </table>

  ${
    notes
      ? `<div class="cover-box"><b>Scope &amp; notes</b><p style="margin:6px 0 0;">${esc(notes)}</p></div>`
      : ''
  }

  <h2>Executive summary</h2>
  <div class="grid">
    <div class="stat"><div class="lbl">Daily energy demand</div><div class="val">${f.power(dailyLoad.totalWhPerDay)}/day</div></div>
    <div class="stat"><div class="lbl">Peak simultaneous load</div><div class="val">${f.power(dailyLoad.peakSimultaneousWatts)}</div></div>
    <div class="stat"><div class="lbl">PV array</div><div class="val">${f.power(pv.actualArrayWatts)}</div><div class="lbl">${pv.seriesCount}S × ${pv.parallelCount}P</div></div>
    <div class="stat"><div class="lbl">Battery bank</div><div class="val">${f.number(battery.actualCapacityAh, 0)} Ah</div><div class="lbl">${battery.batteryCount} cells @ ${systemVoltage} V</div></div>
    <div class="stat"><div class="lbl">Inverter</div><div class="val">${f.power(inverter.selectedContinuousWatts ?? inverter.recommendedContinuousWatts)}</div><div class="lbl">surge ${f.power(inverter.recommendedSurgeWatts)}</div></div>
    <div class="stat"><div class="lbl">Estimated system cost</div><div class="val">${money(cost.total)}</div><div class="lbl">incl. BOS &amp; installation</div></div>
  </div>

  <h2>Single-line diagram</h2>
  ${renderSldHtml(result)}

  <!-- Page 2: load audit + electrical specification -->
  <div class="page">
  <h2>Load audit</h2>
  <table>
    <tr><th>Appliance</th><th>Qty</th><th>W</th><th>h/day</th><th>AC/DC</th><th>Wh/day</th></tr>
    ${loadRows}
    <tr><th colspan="5">Total daily energy</th><th class="num">${f.number(dailyLoad.totalWhPerDay, 0)}</th></tr>
  </table>

  <h2>Electrical specification</h2>
  <table>
    <tr><th>Item</th><th>Value</th></tr>
    <tr><td>System voltage</td><td>${systemVoltage} V</td></tr>
    <tr><td>PV source cable</td><td>${f.cableSize(cables.pvSource.crossSectionMm2)} · ${f.number(cables.pvSource.voltageDropPercent, 2)}% drop</td></tr>
    <tr><td>DC output cable</td><td>${f.cableSize(cables.dcOutput.crossSectionMm2)} · ${f.number(cables.dcOutput.voltageDropPercent, 2)}% drop</td></tr>
    <tr><td>AC output cable</td><td>${f.cableSize(cables.acOutput.crossSectionMm2)} · ${f.number(cables.acOutput.voltageDropPercent, 2)}% drop</td></tr>
    <tr><td>PV source OCPD</td><td>${protection.pvSourceOcpdStandardA} A</td></tr>
    <tr><td>AC breaker</td><td>${protection.acBreakerStandardA} A</td></tr>
    <tr><td>Backfeed rule (120%)</td><td>${protection.backfeedPasses ? 'PASS' : 'FAIL'}</td></tr>
    <tr><td>SPD</td><td>${protection.spdType}</td></tr>
    ${
      result.production.orientation
        ? `<tr><td>PV array orientation</td><td>${f.number(result.production.orientation.tilt, 0)}° tilt · ${f.number(result.production.orientation.azimuth, 0)}° azimuth (factor ×${f.number(result.production.orientation.annualFactor, 2)})</td></tr>`
        : ''
    }
    ${
      result.production.shadingFactor < 1
        ? `<tr><td>Shading derate</td><td>${f.number(result.production.shadingFactor * 100, 0)}% of irradiance</td></tr>`
        : ''
    }
    ${
      controller.minCurrentA > 0
        ? `<tr><td>Charge controller</td><td>${controller.recommendedType} · ${controller.selectedCurrentA ?? controller.minCurrentA} A</td></tr>`
        : ''
    }
  </table>

  ${
    result.warnings.length > 0
      ? `
  <h2>Checks &amp; warnings</h2>
  <table>
    <tr><th>Severity</th><th>Message</th><th>Standard</th></tr>
    ${warningRows}
  </table>`
      : ''
  }
  </div>

  <!-- Page 3: costed BOM + financial -->
  <div class="page">
  <h2>Costed bill of materials</h2>
  <table>
    <tr><th>Category</th><th>Item</th><th class="num">Qty</th><th>Unit</th><th class="num">Unit price</th><th class="num">Total</th></tr>
    ${categoryRows}
    <tr class="total-row"><td colspan="5">Equipment subtotal</td><td class="num">${money(cost.equipmentSubtotal)}</td></tr>
    <tr><td colspan="5">Balance of system (racking, conduit, misc)</td><td class="num">${money(cost.bosTotal)}</td></tr>
    <tr><td colspan="5">Installation &amp; labor</td><td class="num">${money(cost.laborTotal)}</td></tr>
    <tr class="grand-total"><td colspan="5">Total installed cost</td><td class="num">${money(cost.total)}</td></tr>
  </table>

  <h2>Financial &amp; return on investment</h2>
  <div class="roi">
    <div class="lbl">Estimated annual production (${Math.round(result.production.performanceRatio * 100)}% performance ratio)</div>
    <div class="val">${f.number(result.production.annualKwh, 0)} kWh/yr</div>
  </div>
  ${
    cost.batteryAging
      ? `<div class="roi"><div class="lbl">Battery lifespan (${Math.round(result.battery.depthOfDischarge * 100)}% depth of discharge)</div><div class="val">${Number.isFinite(cost.batteryAging.lifespanYears) ? `${f.number(cost.batteryAging.lifespanYears, 1)} years` : 'outlasts the analysis'}</div></div>`
      : ''
  }
  <table>
    <tr><th>Month</th><th class="num">PSH (h/day)</th><th class="num">Yield (kWh)</th></tr>
    ${result.production.months
      .map(
        (m) => `
    <tr>
      <td>${esc(monthLabel(m.month))}</td>
      <td class="num">${f.number(m.psh, 1)}</td>
      <td class="num">${f.number(m.energyKwh, 0)}</td>
    </tr>`,
      )
      .join('')}
    <tr class="total-row"><td>Annual</td><td></td><td class="num">${f.number(result.production.annualKwh, 0)}</td></tr>
  </table>
  <div class="roi">
    <div class="lbl">Estimated annual savings at ${symbol}${f.number(cost.annualSavings / Math.max(cost.annualProductionKwh, 1), 3)}/kWh</div>
    <div class="val">${money(cost.annualSavings)}/yr</div>
  </div>
  <div class="roi">
    <div class="lbl">Simple payback period</div>
    <div class="val">${cost.simplePaybackYears === null ? '—' : `${f.number(cost.simplePaybackYears, 1)} years`}</div>
  </div>
  <div class="roi">
    <div class="lbl">Discounted payback period (${(cost.financial.discountRate * 100).toFixed(0)}% discount rate)</div>
    <div class="val">${
      cost.financial.discountedPaybackYears === null
        ? `not reached within ${cost.financial.systemLifeYears} years`
        : `${f.number(cost.financial.discountedPaybackYears, 1)} years`
    }</div>
  </div>
  <div class="roi">
    <div class="lbl">Net present value (${cost.financial.systemLifeYears} years)</div>
    <div class="val">${money(cost.financial.netPresentValue)}</div>
  </div>
  <div class="roi">
    <div class="lbl">Levelized cost of energy (LCOE)</div>
    <div class="val">${cost.financial.lcoe === null ? '—' : `${symbol}${f.number(cost.financial.lcoe, 3)}/kWh`}</div>
  </div>
  ${
    cost.financial.batteryReplacements.length > 0
      ? `
  <div class="roi">
    <div class="lbl">Battery replacements within system life</div>
    <div class="val">${cost.financial.batteryReplacements
      .map((r) => `year ${r.year} (${money(r.cost)})`)
      .join(' · ')}</div>
  </div>`
      : ''
  }

  <h3 style="font-size:11px; margin:14px 0 4px;">Assumptions</h3>
  <ul class="assumptions">
    ${cost.assumptions.map((assumption) => `<li>${esc(assumption)}</li>`).join('')}
  </ul>
  </div>

  <!-- Page 4: terms + signature -->
  <div class="page">
  <h2>Terms &amp; conditions</h2>
  <ol class="terms">
    ${DEFAULT_TERMS.map((term) => `<li>${esc(term)}</li>`).join('')}
    <li>This proposal is valid until ${esc(validUntil)}.</li>
  </ol>

  <div class="signature">
    <div class="sig">
      <div class="sig-line">${esc(profile.engineerName || 'Prepared by')} — ${esc(profile.companyName || '')}</div>
    </div>
    <div class="sig">
      <div class="sig-line">${esc(clientName || 'Client')} — acceptance &amp; date</div>
    </div>
  </div>

  <div class="footer">
    Generated offline by SlorCalcPro. Calculations per NEC 690/705 and IEC 62548.
    Prices are estimates — verify locally before purchase. Financial projections assume the entered grid tariff and are not guaranteed.
  </div>
  </div>
</body>
</html>`;
}
