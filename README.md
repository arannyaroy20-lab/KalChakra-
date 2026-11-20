# MultiCal — Calendar Converter (Web + Windows Desktop)

MultiCal is a React + TypeScript + Vite calendar converter with an Electron desktop shell for Windows.

## Included calendar systems

- **Bangladesh National Calendar** (`bd-national`): government/national events and holidays, anchored to Gregorian dates.
- **Bangladesh Bengali Calendar** (`bd-bengali`): Gregorian ↔ Bengali conversion using Bangladesh's revised 2019 Bangla Academy calendar.
- **India Bengali Calendar** (`india-bengali`): separate West Bengal-style solar Bangabda conversion and Meeus-based Panchang calculations.
- **ISKCON Mayapur Calendar** (`iskcon-mayapur`): independent Mayapur Panchang, sunrise/sunset and Vaishnava observances.

The four engines remain independent. The UI language (Bengali/English) is separate from calendar selection. Missing capabilities are shown as unavailable rather than inferred.

## Windows development

Run these commands in PowerShell from the project folder:

```powershell
npm install
npm run typecheck
npm test
npm run electron:dev
```

This opens the MultiCal desktop window while Vite serves the renderer. The original browser workflow remains available with `npm run dev`.

## Windows packaging

Build both the installer and portable executable:

```powershell
npm run build:desktop
```

Or build them separately:

```powershell
npm run build:installer
npm run build:portable
```

Artifacts are written to `release/`:
- `MultiCal-0.2.0-x64.exe` — NSIS installer
- `MultiCal-0.2.0-portable-x64.exe` — portable executable

The exact artifact names follow the package version and architecture. Build Windows installers on Windows for the most predictable result.

## Desktop security

The Electron main process is in `electron/main.cjs`. Renderer Node integration is disabled, context isolation and sandboxing are enabled, and no preload bridge is exposed because the current UI does not need privileged desktop APIs. External HTTP(S) links are opened in the system browser; renderer-created windows are denied. The packaged app loads `dist/index.html` from its own application directory.

## Offline behavior and known data coverage

Calendar calculations and bundled datasets are local and work without an internet connection wherever data is available in the repository. The optional BanglaDateToday validation requires internet; if unavailable, the internal Bangladesh Bengali conversion remains authoritative.

Existing data limitations remain unchanged: Bangladesh national event data currently covers 2026–2027; the Bengali calendar engines and Mayapur astronomical/observance calculations retain their documented coverage and precision limitations. Some official/source URLs are references and naturally require internet when opened.

## Converter API

`src/application/calendar-service.ts` provides `getCalendarDay(...)` and `getCalendarMonth(...)`, backed by the existing `CalendarManager`, registry, engine APIs and Phase 5B normalizers.

Bangladesh Bengali dates can optionally be compared against BanglaDateToday. External results are comparison-only and never overwrite the internal engine result. See [docs/WORKING_CONVERTER_UI.md](docs/WORKING_CONVERTER_UI.md).

## Baseline

This deliverable starts from **Phase 5B** (four engines + Phase 5A integration + Phase 5B unified date model). **Phase 5C is not included.** Existing engine calculations and Phase 5A/5B modules are preserved.
