# Universal Solar Calculator (quickcalc)

A self-contained Expo (React Native) rewrite of the `SolarCalPro5.html` (v2.4.0) web calculator —
a solar system sizing tool with **Arabic (RTL) + English** support. It lives in `quickcalc/` as a
**separate project** from the main `SolarCalcPro` app (which uses an NEC/IEC engineering engine).

- **Stack:** Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · React Native Paper · Zustand
- **Persistence:** AsyncStorage (`solar-calc-web-v2` key)
- **Basis:** Ported from `SolarCalPro5.html` (v2.4.0); that file is no longer stored in the repo

## Key difference from the main SolarCalcPro app

This app mirrors the HTML calculator's methodology exactly, including its night-only battery
sizing:

- **Battery sized from NIGHT energy only** (`E_night / (DOD × η)`), not total daily energy.
  (The main app's `src/core/formulas/battery.ts` sizes from total energy and is intentionally
  NOT used here.)
- Solar sized as `(E_day + E_night/0.85) × 1.3 × 1.3 / sun_hours` (the HTML applies the 1.3
  margin twice — kept for faithful parity).
- Inverter, cable, and breaker sizing match the HTML's standard-size tables and 3% voltage drop.

## Features

- 3 input modes: **Detailed** (appliance list), **Monthly** (electricity bill), **Rooftop** (area)
- Global **equation library** with tap-to-view formulas, worked examples, and your live value
- **Results screen**: energy stats, day/night distribution chart, inverter/battery/solar cards,
  technical detail table, current/cable/breaker table, install & maintenance tips
- **Session history**: save/restore/delete up to 10 sessions
- **Export**: share a plain-text report (expo-file-system + expo-sharing) or print/share PDF
  (expo-print)
- Language toggle with runtime RTL (no reload)

## Requirements

- Node.js ≥ 22.13 (project developed on v24)

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run start` | Start Expo dev server |
| `npm run android` / `npm run ios` | Run on device/emulator |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests (calculator core) |
| `npm run format` | Prettier (write) |

## Project layout

```
src/
  app/              Expo Router screens: (tabs)/index, (tabs)/equations, (tabs)/history, results
  components/       Reusable UI: Select, NumberField, ApplianceRow, ModeSelector,
                    MonthlySection, RooftopSection, SettingsSection, DistributionChart,
                    EquationDialog, HintIcon, LanguageToggle
  core/             Pure logic (framework-free): calculator, constants, equations,
                    types, validate, makeLabels, report
  i18n/             ar/en dictionaries + LanguageProvider (dir-aware)
  store/            Zustand stores: calculatorStore (persisted), uiStore (equation dialog)
  theme/            Color palette + Paper theme
```

`src/core/*` is kept framework-free and is the tested surface (`src/core/__tests__/calculator.test.ts`).

## Status

Implemented and green: `typecheck` ✓, `lint` ✓, `npm test` (19 tests) ✓.
Awaiting an on-device smoke test before first release build.

## Notes

- Faithful parity with the HTML means some sizing intentionally carries the HTML's oversized
  margins (double 1.3 on solar). Revisit `src/core/calculator.ts` if parity is no longer required.
- The HTML's `EquationSystem.showEquation` bug (capital `E`) is fixed here via a global equation
  dialog (`src/components/EquationDialog.tsx`).
