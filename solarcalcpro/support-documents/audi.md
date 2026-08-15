# SlorCalcPro — Technical Audit & Consolidated Remaining-Work Plan

Audited against the actual codebase (commits up to `466a988`).

**Headline:** the premise that "only Phases E/F remain" is **not accurate** — several Phase A/C/D items are still open and must be backported.

---

## 1. Critical Phase A items — verified status

| Finding | Status | Evidence |
|---|---|---|
| **#10 Cable catalog inert** | ✅ **Fully wired** (commit `8c87bbd`) | `engine.ts:200-202` passes `input.selected?.pvCable/dcCable/acCable` into cable sizing; `formulas/cable.ts:37` honors the user-chosen cable with `fromCatalog: true`, reports ΔV/ampacity vs design limits. Selections persist per scenario. **Not a P0 gap.** |
| **#4 No input validation** | ✅ **Done** (commit `5593db1`) | `NumberField` (`form.tsx:58-72`) clamps out-of-range values and shows a `clamped` visual error state; formulas re-clamp defensively (`production.ts:89-90` clamps derate 0.3–1 and shading 0.5–1; `batteryAging.ts:62-63` clamps DoD). |
| **#3 Save errors silently swallowed** | ✅ **Done** | `DesignWizard.tsx:924` surfaces `saveError` via `Snackbar`; reports screen uses `notify()` on every export path (success + failure). |
| **#22 On-grid shows zero-value cards** | ✅ **Done** | Battery/controller inputs and the battery-results card are wrapped in `!isOnGrid` conditionals (`DesignWizard.tsx:581, 781, 811, 1056, 1431` shows "No battery bank modelled (on-grid)"). |
| **#21 Dead code** | ✅ **Done** | Zero matches for `ScreenScaffold`, `ToggleField`, `ChipList`, or unused search helpers anywhere in `src/` (commit `5593db1`). |

**All five are closed.** No P0 backport needed here.

## 2. ROI ↔ production integration
**Integrated.** `costing.ts:191` reads `result.production.annualKwh` for the payback; `financial.ts` derives LCOE and lifetime production from it; the assumption line (`costing.ts:225`) states "Solar yield simulated monthly (PVWatts-style)". ROI already flows through the monthly engine — and the new shading/tilt/aging features feed it (tilt & orientation adjust the PSH curve; battery aging drives replacement cost). **Not a P0 issue.**

## 3. Excel export
**Not validated, and not implemented.** There is zero `exceljs`/`xlsx` in the repo or `package.json`. **CSV is the confirmed, working fallback** (`reports/csv.ts`, `reports.tsx:165` "Share BOM CSV"). Recommendation: ship v1 on CSV only; validate an offline xlsx writer as a v1.1 (P2) item — no release risk.

## 4. Feature-flag / Pro-gating architecture
**NOT built.** No `capabilities`, `isPro`, or flag module exists anywhere. **This is the one genuine P0 prerequisite** for Phase F — you cannot gate Pro features without it. Must be the first thing built in F.

## 5. PSH data scope
- **Current coverage: 36 seeded cities** (not 37) in `src/data/psh.ts`, all with `latitude`/`longitude` (36/36 have coordinates).
- **Latitude model exists but is partial:** `synthMonthlyPsh` (`production.ts:46`) is latitude-aware (flips the seasonal peak in the southern hemisphere), and `psh_repo` stores latitude. But there is **no nearest-city / latitude-fallback** when the user's site isn't in the list, and **PSH is still winter/summer only — no monthly PSH columns**.
- Expansion + worst-month auto-selection + monthly PSH is entirely **Phase C/E, still open**.

## 6. Surprising gaps (not in your original premise)
These Phase A/C/D items are **still open**, so the "only E/F remain" assumption is wrong:

- **Phase C not complete:** generator sizing (in progress at time of audit), solar water-pumping *sizing* (only static appliance presets exist in `bundles.ts` — no head/flow→power model), 24h load-profile editor, EV charging presets, monthly PSH + worst-month.
- **Phase A:** full-DB backup/restore is missing — only per-project JSON export (`jsonIO.ts`); no whole-DB export.
- **Phase D:** SLD PNG export (`react-native-view-shot`), KML, Excel, and site photos/signatures on the proposal are all unimplemented.
- Also noted: the CHANGELOG holds "Phase 6 QA & Ship" until the owner requests it after APK testing — intentional.

---

# Consolidated remaining-work plan (E + F + backported A/C/D)

**Owner:** all items are solo (you) unless noted; dependencies shown per row. Effort = focused dev days.

## Backported corrections (from A/C/D)

| Task | Crit | Depends on | Effort | Notes |
|---|---|---|---|---|
| Full-DB backup/restore (whole SQLite export + import) | **P0** | none | 1 d | Data safety before release |
| Generator sizing for hybrid (charger rating + fuel estimate) | **P0** | none — **in progress** | 1 d | charger kW from peak load; fuel = kWh/(specific consumption) |
| Monthly PSH + expanded cities (200–300) + worst-month auto-selection | **P0** | DB migration + seed refresh | 1.5 d | accuracy core; replaces winter/summer model |
| SLD PNG export + tap-for-details | P1 | none | 1.5 d | `react-native-view-shot`; validate on SDK 57 first |
| Site photos + signature block on proposal | P1 | proposal engine | 1 d | |
| Solar water-pumping sizing (static/dynamic head, flow → pump W) | P1 | none | 1.5 d | high emerging-market value |
| 24h load-profile editor + daily chart | P1 | DB migration (v7) | 2 d | |
| EV charging presets | P1 | none | 0.5 d | reuse preset infra |
| Excel export | P2 | none | 2 d | validate exceljs; **CSV fallback confirmed** for v1 |
| KML roof-layout export | P2 | generator/tilt work | 1 d | |

## Phase E — Data ecosystem

| Task | Crit | Depends on | Effort |
|---|---|---|---|
| Expanded seed catalog (brands per region, EV chargers, generators, water pumps, Al + 90°C ampacity) | P1 | monthly-PSH seed refresh | 2 d |
| Preset & bundle management UI (CRUD) | P1 | none | 1.5 d |
| Site templates (small home, clinic, telecom, water pumping…) | P1 | generator + pumping sizing | 1 d |
| Datasheet import wizard (copy+tweak) | P2 | preset UI | 2 d |
| Reference library upgrade (checklist, formula explainer, glossary) | P2 | none | 1.5 d |

## Phase F — Distribution, scale & Pro readiness

| Task | Crit | Depends on | Effort |
|---|---|---|---|
| **Feature-flag / capabilities module + Pro gating** | **P0** | none (do first) | 1 d |
| Store assets, onboarding/first-run, a11y & perf pass | P1 | flags module | 1.5 d |
| Play Store submission package | **P0** | all P0s | 1 d |

**Sequencing:** (1) full-DB backup → (2) finish generator sizing → (3) monthly PSH + cities → (4) flags module (F prerequisite) → (5) remaining P1s → (6) P2s if time. Rough total: **~2.5–3 focused weeks** to clear P0+P1; P2s are v1.1-safe.
