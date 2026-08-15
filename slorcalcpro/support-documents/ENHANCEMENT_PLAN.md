# SlorCalcPro — Competitive Enhancement Plan (v2 Roadmap)

> Status: proposed for owner review. Decisions confirmed: keep 100% offline · free now with Pro tier later · cost/quoting + ROI/payback in scope · English-only (i18n-ready structure).

---

## 1. Competitive assessment & thesis

**Where it stands today (v0.1.0):** a genuinely strong engineering core — pure-TS sizing engine (load → PV/battery/inverter/controller/cables/protection), NEC/IEC compliance checks, audit trail, editable component catalog, projects/scenarios, SLD, PDF/BOM/JSON reports, scenario comparison — all 100% offline. **No competitive Android app in this class combines offline engineering depth + editable catalogs + professional reports.**

**Direct competitors & what they lack:**
- **Helioscope / Aurora Solar (cloud):** full quoting/ROI/design — but online-only, expensive.
- **SMA Sunny Design / Victron / Renogy calculators:** free but single-vendor, shallow, mostly one-off sizing, no project/quotation workflow.
- **PVWatts / PVGIS:** production simulation only, no sizing/reporting.
- **Generic "solar calculator" apps:** gimmicky, no engineering depth or compliance.

**Differentiation thesis:** become the *offline-first professional design & quoting tool* — sizing with compliance + catalog + **cost/ROI** + client-grade proposal documents, running entirely on-device. The three moats: **engineering trust** (audit trail + standards), **workflow** (projects/scenarios/quotes), and **portability** (no internet needed).

---

## 2. Review findings driving this plan (traceability)

| # | Finding from review (file refs) | Addressed in |
|---|---|---|
| 1 | Advanced engine inputs (inverter η, loss factor, voltage-drop %, temp derating, cable lengths, busbar/main breaker) fully plumbed but **no UI** (`DesignWizard.tsx`, `repos/projects.ts:637-661`) | Phase A |
| 2 | Length (m/ft) and Temperature (°C/°F) settings are **dead** — never applied in UI (`settings.tsx:45-80`, `format.ts:35-51`) | Phase A |
| 3 | Save errors **silently swallowed** (`DesignWizard.tsx:287-289`) | Phase A |
| 4 | No input validation bounds anywhere (negative watts, DoD>1, efficiency>1 accepted) (`CatalogEditor`, `LoadEditor`, `form.tsx`) | Phase A |
| 5 | `clientName`/`notes` orphaned (stored/exported, never editable) (`[id].tsx`) | Phase A |
| 6 | Add-scenario doesn't enter editor; no duplicate/reorder scenario (`[id].tsx:216-218`) | Phase A |
| 7 | Catalog delete leaves scenarios referencing missing components (`catalog.tsx`) | Phase A |
| 8 | No favorites filter (store tracks them, no UI) (`catalog.tsx`, `store/catalog.ts:11,30`) | Phase A |
| 9 | Comparison + project cards ignore user unit settings (`comparison.ts:16-28`, `[id].tsx:102`) | Phase A |
| 10 | Cable catalog is **inert** — engine never uses it (`cableTable.ts`) | Phase A/C |
| 11 | No pricing/costing anywhere (`bom.ts` quantities only) | **Phase B** |
| 12 | Production simulation absent (only winter/summer PSH, no yield/PR) | Phase C |
| 13 | Tilt/orientation guidance absent; PSH = winter+summer only | Phase C |
| 14 | No generator sizing, no water-pumping sizing (major off-grid niches) | Phase C |
| 15 | PDF is a single design summary, no client branding/logo, no costed BOM, no quote | Phase B/D |
| 16 | SLD purely visual — no tap-for-details, no image export (`SldView.tsx`) | Phase D |
| 17 | Only JSON/CSV/PDF exports; no Excel/KML/ZIP | Phase D |
| 18 | No preset-management UI (DB supports manual presets) (`LoadEditor`) | Phase E |
| 19 | Only 37 PSH cities; seed catalog ~25 panels/25 inverters/19 batteries | Phase E |
| 20 | No i18n (all strings hardcoded; `expo-localization` unused) | Phase A (structure) |
| 21 | Dead code: `ScreenScaffold`, `ToggleField`, `ChipList`, unused store search helpers | Phase A |
| 22 | On-grid results render zero-value battery/controller cards | Phase A |
| 23 | No onboarding, no feature-gating architecture, no store assets | Phase F |

---

## 3. Roadmap

### Phase A — Foundation hardening & UX completeness *(highest ROI; ~1.5 wks)*
Fix trust and polish gaps before adding features:
- **Expert-mode power inputs:** expose inverter efficiency, loss factor, DC/AC voltage-drop limits, temp derating, PV/DC/AC cable lengths, busbar & main-breaker ratings (all already plumbed).
- **Wire up Length + Temperature unit settings**; make project cards + comparison unit-aware.
- **Input validation:** min/max bounds in `NumberField`/`CatalogEditor`/`LoadEditor` (no negatives, DoD≤1, efficiency≤1, sensible ranges); validation messages.
- **Surface save/load errors** via snackbar/dialog instead of console.
- **Project & scenario UX:** edit client name + notes; duplicate scenario; reorder; add-scenario navigates into editor; promote-active on delete of active scenario.
- **Catalog integrity:** warn/block deleting a component in use by a scenario (offer "keep reference copy"); favorites filter chip.
- **Cable catalog decision:** wire user-selected cables into the design (recompute with chosen size, flag ampacity) — or hide the tab. (Recommend wiring.)
- **On-grid results polish:** hide battery/controller cards instead of showing zeros.
- **i18n-ready strings:** move all literals to a typed `strings` module (en-US default). Zero behavior change; future languages cheap.
- **Backup hardening:** full-DB backup/restore (all projects + catalogs), not just per-project JSON; scoped-storage export.
- **Dead-code cleanup** (`ScreenScaffold`, `ToggleField`, `ChipList`, unused helpers).

### Phase B — Cost estimation, quoting & financial analysis *(flagship; ~2 wks)*
Per owner decision, cost/quoting is now in scope.
- **Data:** `priceOverrides` table (component→unit price, currency); price fields in CatalogEditor; bulk price editor; per-project currency + overhead/labor/transport/tax line items; default currency setting.
- **Costed BOM:** per-line unit cost × qty → extended cost, subtotals by category, total installed cost. Pure-TS `costing.ts` with golden tests.
- **Financial module (pure TS, tested):** simple payback, discounted payback, LCOE ($/kWh), NPV with discount rate/system life, battery replacement schedule (cycle life → replacement year), on-grid bill-offset + net-metering comparison, tariff input.
- **Quote/proposal document:** costed BOM table, financial summary, validity/warranty/terms fields, client branding (below).
- **Pro-readiness:** introduce a `capabilities` feature-flag module now, so Phase B+ features can be gated behind a future Pro unlock without rework.

### Phase C — Engineering depth & production modeling *(~2.5 wks)*
- **Production simulation (PVWatts-style, pure TS):** monthly energy yield from array size, tilt, azimuth, PSH, ambient temp, and loss stack (soiling, mismatch, wiring, temperature, inverter efficiency) → annual yield, performance ratio, seasonal chart.
- **Tilt/orientation:** optimal tilt by latitude; sensitivity table (yield vs tilt/azimuth).
- **Shading & layout:** manual shading-loss input now; Phase D adds a simple roof/array layout editor.
- **Expanded solar resource:** more PSH cities (major markets by region), **monthly** PSH instead of winter/summer only, "worst-month" auto-selection.
- **Generator sizing** for hybrid (charger rating, fuel consumption estimate).
- **Solar water pumping preset** (static head, dynamic head, flow → pump power, daily energy) — high value in emerging markets.
- **Battery aging:** cycle-life vs DoD chart, expected lifespan, replacement recommendation feeding the financial model.
- **Load profile:** 24-hour load-shape editor + daily profile chart.
- **EV charging load presets.**

### Phase D — Professional proposal & document suite *(~2 wks)*
- **Client branding:** company name/logo image/signature/engineer credentials/project address/site photo on reports.
- **Structured proposal:** cover page → summary → loads → SLD → electrical spec → costed BOM → financial/ROI → terms → signature page, with page-break control.
- **Exports:** PNG image of SLD (`react-native-view-shot`), Excel workbook for BOM/quote (validate an offline xlsx writer; fallback to multi-sheet CSV), ZIP of project folder, KML for roof layouts (Phase C).
- **Interactive SLD:** tap node → detail popover; highlight non-compliant nodes.

### Phase E — Data ecosystem & catalog power *(~1.5 wks)*
- **Expanded seed data:** verified manufacturer entries (major global brands per region), plus EV chargers, generators, water pumps, rack/battery modules, mounting/BOS, aluminum + 90°C ampacity tables.
- **Datasheet import (offline):** structured "copy from existing + tweak" wizard rather than OCR (offline OCR is heavy and needs camera permission — excluded deliberately).
- **Preset & bundle management UI** (create/edit/delete appliance presets).
- **Site templates:** prebuilt scenario templates (small home, cabin, clinic, telecom tower, farm, water pumping) that pre-fill loads and sizing.
- **Reference library upgrade:** searchable standards checklist, formula explainer with worked examples, glossary, unit cheat-sheet.

### Phase F — Distribution, scale & Pro readiness *(~1 wk)*
- **Feature-gating architecture** (from Phase B) completed; Pro capability definition documented.
- **Onboarding:** first-run guide for the wizard + new-project templates.
- **Performance/size:** APK size review, FlashList pagination for large catalogs, PDF render timing.
- **Accessibility:** TalkBack labels, contrast, large-text support, ≥44dp touch targets.
- **Store readiness:** screenshots (spec sizes), feature graphic, short/long description, privacy policy, Data Safety form (still "no data collected").

---

## 4. Priority & sequencing

| Phase | Theme | Effort | Value | Do first? |
|---|---|---|---|---|
| A | Hardening + UX gaps | 1.5 wk | Trust/polish | ✅ Now |
| B | Cost/quoting/ROI | 2 wk | **Flagship moat** | ✅ Next |
| C | Engineering depth | 2.5 wk | Differentiation | Then |
| D | Proposals/exports | 2 wk | Win-the-job | Then |
| E | Data ecosystem | 1.5 wk | Retention | Later |
| F | Distribution/scale | 1 wk | Growth | Later |

**Suggested order:** A → B → D (so quotes are professional) → C → E → F.

---

## 5. Risks & decisions

- **Pro gating vs offline:** Play IAP licensing needs device/network state; an offline Pro unlock is doable (cached purchase/license check) but must be designed carefully — defer final mechanism to Phase F. This is why "Pro later" fits a fully-offline app.
- **Cost accuracy:** prices are user-entered; seed prices must be flagged as samples ("verify locally").
- **Financial assumptions:** payback/LCOE depend on tariff & load assumptions — show inputs, add disclaimer, keep assumptions editable.
- **Excel export:** must validate an offline xlsx writer on Expo SDK 57; CSV fallback is safe.
- **Camera/OCR excluded:** keeps permissions minimal and the "no special permissions" Play advantage.
- **i18n:** structured now, translated later — no behavior change in this release.
