import { designSystem } from '../../core/engine';
import { estimateCost } from '../../core/formulas/costing';
import type { LoadItem, SystemInput } from '../../core/types';
import { formatNumber } from '../../utils/format';
import { buildProposalPdfHtml } from '../proposal';
import { buildSldDiagram } from '../sld';

function sampleInput(systemType: SystemInput['systemType'] = 'off-grid'): SystemInput {
  const loads: LoadItem[] = [
    {
      id: 'l1',
      name: 'LED lights',
      quantity: 8,
      powerWatts: 12,
      hoursPerDay: 5,
      isAc: true,
      isSimultaneous: false,
      isInductive: false,
    },
    {
      id: 'l2',
      name: 'Fridge',
      quantity: 1,
      powerWatts: 150,
      hoursPerDay: 10,
      isAc: true,
      isSimultaneous: true,
      isInductive: true,
      surgeFactor: 6,
    },
  ];
  return {
    loads,
    systemType,
    winterPsh: 4.0,
    summerPsh: 6.0,
    autonomyDays: 2,
    chemistry: 'lifepo4',
    pvCableLengthM: 8,
    dcCableLengthM: 2,
    acCableLengthM: 10,
  };
}

function proposalData(overrides?: Partial<Parameters<typeof buildProposalPdfHtml>[0]>) {
  const result = designSystem(sampleInput());
  const base = {
    projectName: 'Riyadh Villa',
    clientName: 'A. Al-Saud',
    notes: 'Install roof-mounted system.',
    quoteNumber: 'Q-2026-08-01-riyadh',
    issueDate: '2026-08-01',
    validUntil: '2026-08-31',
    validityDays: 30,
    scenario: {
      id: 's1',
      projectId: 'p1',
      name: 'Base design',
      isActive: true,
      systemType: 'off-grid' as const,
      systemVoltageV: null,
      chemistry: 'lifepo4' as const,
      autonomyDays: 2,
      winterPsh: 4,
      summerPsh: 6,
      pshLocation: null,
      inverterEfficiency: null,
      systemLossFactor: null,
      dcVoltageDropPercent: null,
      acVoltageDropPercent: null,
      minTemperatureC: null,
      tempDeratingFactor: null,
      pvCableLengthM: null,
      dcCableLengthM: null,
      acCableLengthM: null,
      busbarRatingA: null,
      mainBreakerA: null,
      selectedPanelId: null,
      selectedInverterId: null,
      selectedBatteryId: null,
      selectedControllerId: null,
      selectedPvCableId: null,
      selectedDcCableId: null,
      selectedAcCableId: null,
      loadMode: 'appliances' as const,
      totalDailyKwh: null,
      totalPeakKw: null,
      totalSurgeKw: null,
      totalLoadIsAc: true,
      loads: result.input.loads,
      designResult: result,
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    },
    result,
    cost: estimateCost(result, { electricRate: 0.15, currency: '$' }),
    profile: {
      companyName: 'Desert Solar Co.',
      tagline: 'Clean energy for the Gulf',
      engineerName: 'Eng. Mohammed Almaqan',
      phone: '+966 50 000 0000',
      email: 'design@desertsolar.test',
      address: 'King Fahd Rd, Riyadh',
      logoDataUri: '',
    },
  };
  return { ...base, ...overrides };
}

describe('buildProposalPdfHtml — structured proposal', () => {
  it('renders company branding and contact details', () => {
    const html = buildProposalPdfHtml(proposalData());
    expect(html).toContain('Desert Solar Co.');
    expect(html).toContain('Clean energy for the Gulf');
    expect(html).toContain('Eng. Mohammed Almaqan');
    expect(html).toContain('+966 50 000 0000');
    expect(html).toContain('design@desertsolar.test');
    expect(html).toContain('King Fahd Rd, Riyadh');
  });

  it('embeds the bundled company logo by default', () => {
    const html = buildProposalPdfHtml(proposalData());
    expect(html).toContain('class="logo-img"');
    expect(html).toContain('data:image/png;base64,');
  });

  it('uses an uploaded custom logo when provided', () => {
    const customUri = 'data:image/png;base64,CUSTOMLOGO==';
    const html = buildProposalPdfHtml(
      proposalData({ profile: { ...proposalData().profile, logoDataUri: customUri } }),
    );
    expect(html).toContain(`src="${customUri}"`);
  });

  it('renders quote meta, project and client', () => {
    const html = buildProposalPdfHtml(proposalData());
    expect(html).toContain('Q-2026-08-01-riyadh');
    expect(html).toContain('2026-08-31');
    expect(html).toContain('Riyadh Villa');
    expect(html).toContain('A. Al-Saud');
  });

  it('includes a costed BOM with totals', () => {
    const data = proposalData();
    const html = buildProposalPdfHtml(data);
    expect(html).toContain('Costed bill of materials');
    expect(html).toContain('Equipment subtotal');
    expect(html).toContain(`$${formatNumber(data.cost.equipmentSubtotal, 2)}`);
    expect(html).toContain(`$${formatNumber(data.cost.bosTotal, 2)}`);
    expect(html).toContain(`$${formatNumber(data.cost.laborTotal, 2)}`);
    expect(html).toContain('Total installed cost');
    expect(html).toContain(`$${formatNumber(data.cost.total, 2)}`);
  });

  it('includes financial / ROI figures', () => {
    const data = proposalData();
    const html = buildProposalPdfHtml(data);
    expect(html).toContain('Financial &amp; return on investment');
    expect(html).toContain(`${formatNumber(data.cost.annualProductionKwh, 0)} kWh/yr`);
    expect(html).toContain(`$${formatNumber(data.cost.annualSavings, 2)}/yr`);
    expect(html).toContain('Simple payback period');
    expect(html).toContain(`${formatNumber(data.cost.simplePaybackYears as number, 1)} years`);
  });

  it('includes the cash-flow analysis (NPV, LCOE, discounted payback)', () => {
    const data = proposalData();
    const html = buildProposalPdfHtml(data);
    expect(html).toContain('Discounted payback period');
    expect(html).toContain('Net present value');
    expect(html).toContain(`$${formatNumber(data.cost.financial.netPresentValue, 2)}`);
    expect(html).toContain('Levelized cost of energy (LCOE)');
    expect(html).toContain(`${data.cost.financial.systemLifeYears} years`);
  });

  it('includes terms, signature page and page-break control', () => {
    const html = buildProposalPdfHtml(proposalData());
    expect(html).toContain('Terms &amp; conditions');
    expect(html).toContain('acceptance &amp; date');
    expect(html).toMatch(/page-break-before:\s*always/);
    expect(html).toContain('Prepared by');
  });

  it('escapes user-entered notes and client name', () => {
    const html = buildProposalPdfHtml(
      proposalData({ clientName: '<Bobby> & Co', notes: 'Include <script>alert(1)</script>' }),
    );
    expect(html).toContain('&lt;Bobby&gt; &amp; Co');
    expect(html).not.toContain('<script>');
  });

  it('includes the single-line diagram section', () => {
    const html = buildProposalPdfHtml(proposalData());
    expect(html).toContain('Single-line diagram');
  });
});

describe('buildSldDiagram — interactive details & compliance flags', () => {
  it('annotates every node with detail lines', () => {
    const diagram = buildSldDiagram(designSystem(sampleInput()));
    expect(diagram.nodes.length).toBeGreaterThan(5);
    for (const node of diagram.nodes) {
      expect(node.detail.length).toBeGreaterThan(0);
    }
  });

  it('adds a battery branch node for off-grid systems', () => {
    const diagram = buildSldDiagram(designSystem(sampleInput()));
    const battery = diagram.nodes.find((n) => n.id === 'battery');
    expect(battery).toBeDefined();
    expect(battery?.detail.join(' ')).toContain('Ah');
  });

  it('flags the AC breaker when the 120% backfeed rule fails', () => {
    const onGrid = designSystem(
      sampleInput('on-grid').busbarRatingA === undefined
        ? { ...sampleInput('on-grid'), busbarRatingA: 100, mainBreakerA: 100 }
        : sampleInput('on-grid'),
    );
    const diagram = buildSldDiagram(onGrid);
    const breaker = diagram.nodes.find((n) => n.id === 'ac-breaker');
    expect(breaker?.flagged).toBe(true);
    expect(breaker?.flaggedReason).toContain('backfeed');
  });

  it('keeps every edge endpoint valid', () => {
    const diagram = buildSldDiagram(designSystem(sampleInput()));
    const ids = new Set(diagram.nodes.map((n) => n.id));
    for (const edge of diagram.edges) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });
});
