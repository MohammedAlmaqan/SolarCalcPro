# SolarCalcPro (main app)

Professional solar system design tool for Android — 100% offline.

- **Platform:** Android (Play Store via EAS, AAB)
- **Connectivity:** None required. No `INTERNET` permission is granted.
- **Stack:** Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · React Native Paper · SQLite
- **Scope:** See `support-documents/Technical_Studay.md` (requirements) and `support-documents/PLAN.md` (approved plan).
- **Progress:** See `support-documents/CHANGELOG.md`.
- **Sibling app:** `../quickcalc/` — a separate Expo project that re-implements the HTML solar calculator
  (`SolarCalPro5.html`) with Arabic/English support. This app is NOT used there; that port is standalone.

## Requirements

- Node.js ≥ 22.13
- An Expo account (`owner: merathdev`) for EAS remote builds

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run start` | Start Expo dev server |
| `npm run android` | Run on Android device/emulator |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests (engine, formulas, DB, reports) |
| `npm run format` | Prettier (write) |
| `npx expo-doctor` | Expo project health check |
| `npx eas build --profile production --platform android` | Release AAB |

## Key design notes

- All commands run from this directory (`solarcalcpro/`), not the repo root.
- Sizing is based on an NEC/IEC engineering engine in `src/core/formulas/` + `src/core/standards/`.
- Battery sizing uses **total daily energy** (see `src/core/formulas/battery.ts`) — deliberately
  different from the HTML/quickcalc app, which sizes from night energy only.
