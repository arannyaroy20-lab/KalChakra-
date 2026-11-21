# MultiCal

**MultiCal** (`KalChakra`) is a cross-platform calendar converter, astronomical Panchang viewer, and daily personal planner built with **React 19**, **TypeScript**, **Vite**, and **Electron**.

It keeps four independent regional and astronomical calendar systems side by side without conflating their rules, alongside a bilingual (`Bengali` / `English`) interface, personal **My Agenda** tracking, a **12-hour Ring Clock Schedule** manager, system-tray background operation, and two-stage native desktop reminders.

---

## Download

Pre-built Windows desktop binaries are available in the **[Releases](../../releases)** section of this repository:

- **Windows Installer (`NSIS`)**: `MultiCal-0.2.0-x64.exe`
- **Windows Portable**: `MultiCal-0.2.0-portable-x64.exe`

---

## Key Features

### 1. Four Independent Calendar Engines + Dual Hindu Mode

Every calendar engine runs independently with strict provenance and explicit capability boundaries (missing capabilities are never inferred or fabricated):

| Engine ID | System | Primary Coverage |
| :--- | :--- | :--- |
| `bd-national` | **Bangladesh National Calendar** | Official public, executive, optional, and regional holidays anchored to Gregorian dates (`2026–2027` dataset). |
| `bd-bengali` | **Bangladesh Bengali Calendar** | Revised 2019 Bangla Academy Gregorian <-> Bangabda conversion with optional external validation against BanglaDateToday. |
| `india-bengali` | **West Bengal Panjika** | Traditional solar Bangabda conversion (Drik/Surya Siddhanta Sankranti rules) and Meeus-based Panchang limbs. |
| `iskcon-mayapur` | **Sanatan Panchang & ISKCON Mayapur** | Dual mode selectable in Settings (**Sanatan** default or **ISKCON Mayapur**): sunrise/sunset, Tithi, Nakshatra, Yoga, Karana, Ekadashi, Purnima, Amavasya, and major festivals. |

### 2. Multi-View Workspace

- **Home**: Displays today's Gregorian date alongside unboxed Bangladesh and West Bengal Bengali dates, a context-aware Hero spotlight, today's chronological **Schedule** timeline (when scheduled), remaining agendas, today's recorded holidays/observances, Panchang tiles, and upcoming month events.
- **Calendar**: Full monthly grid for any selected engine with native Bangla month span strips, keyboard navigation (`Arrow` keys + `PageUp`/`PageDown`), and day inspection sidebar.
- **All Engines**: Unified monthly grid comparing Gregorian, Bangladesh Bengali, and West Bengal Bengali dates together with toggleable event layers.
- **Agenda**: Chronological monthly list of events across active calendar layers.
- **My Agenda**: Personal event and milestone planner with interactive date picker, priority drag-and-drop ordering, and custom/default category notes.
- **Schedule**: Time-blocked daily task planner driven by an interactive 12-hour Ring Clock.

### 3. Home Hero Priority Logic

The top-right Hero spotlight automatically resolves what matters most at the current moment in Asia/Dhaka time using a strict precedence chain:

```text
Active Schedule (during Start - End window)
  > Timed Hourly Agenda (active window)
    > Priority #1 All-Day Agenda
      > Time-of-Day Greeting (Morning / Noon / Afternoon / Evening / Night)
```

When an active schedule takes the Hero spotlight, all of today's agendas remain visible below in the agenda section so nothing is hidden.

### 4. My Agenda (`আমার এজেন্ডা`)

- **Priority Management**: Drag-and-drop (plus keyboard/button Up & Down controls) to set which all-day agenda leads for the day.
- **Time Modes & Recurrence**: All-day or specific time, with repeat patterns (`Once`, `Weekly`, `Monthly`, `Yearly`, or custom `Specific weekdays`).
- **10 Built-in Categories**: Marriage, Birthday, Exam, Holiday, Party, Work, Health, Prayer, Family, and Custom — each paired with its own icon and default bilingual note.

### 5. Schedule & 12-Hour Ring Clock (`সময়সূচী`)

- **Interactive 12-Hour Dual-Handle Ring Clock**: Set time ranges visually by dragging **Start** and **End** handles around a 12-hour dial (5-minute snap), paired with dedicated **AM / PM** switchers and `±15m` fine steppers.
- **10 Daily Activity Categories**: Study, Singing & Music, Health & Fitness, Work & Focus, Meal & Prep, Rest & Sleep, Prayer & Meditation, Creative Hobby, Meeting & Call, and Other.
- **Start-to-Start Progress Rail**: When two or more schedules exist on a day, a vertical progress track runs from each schedule's start time toward the next schedule's start time with a live moving cursor.
- **10-Minute `Got it` Window & Immutability**:
  - Schedules can be edited or deleted anytime before their start time arrives.
  - Once a schedule reaches its start time, editing and deletion lock automatically.
  - A **Got it** tick button stays active for **10 minutes** from start time: ticking within 10 minutes marks the occurrence done with a green checkmark; missing the 10-minute window marks it as **Passed**.

### 6. Bilingual & Theme Customization

- Instant switching between **Bengali (`বাং`)** and **English (`EN`)** independent of calendar engine selection.
- **Light** and **Dark** appearance modes with 6 curated accent themes (`Mint`, `Forest`, `Blue`, `Clay`, `Purple`, `Red`).

---

## Desktop Architecture & Capabilities

When launched as an Electron desktop application, MultiCal extends browser storage with native OS integration:

- **System Tray Resident Lifecycle**: Closing the main window (`X`) minimizes the application to the system tray instead of exiting. Clicking the tray icon restores the window; choosing **Quit** from the tray menu exits cleanly.
- **Single-Instance Lock**: Opening a second instance focuses the existing window rather than spawning duplicate processes.
- **Local Disk Persistence**: Agendas and schedules persist to `agendas.json` and `schedules.json` inside Electron's `app.getPath("userData")` directory, automatically migrating existing `localStorage` entries on first desktop launch.
- **Two-Stage Native Notifications**: Background scheduler checks every 15 seconds (Asia/Dhaka timezone) for items with reminders enabled:
  1. **2 Minutes Before**: Sends an upcoming reminder notification with 12-hour formatted time.
  2. **At Start Time**: Notifies when the agenda or schedule starts (reminding users of the 10-minute `Got it` window and opening the corresponding view on click).
- **Sandboxed Security Model**:
  - `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true` in `electron/main.cjs`.
  - Strict typed IPC channel exposure via `contextBridge` in `electron/preload.cjs` (`window.multiCalDesktop`) without exposing raw `ipcRenderer` or Node APIs.
  - Navigation locked to the local Vite server (dev) or packaged `dist/index.html` (production), with external links delegated to the OS browser.

---

## Tech Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6
- **Desktop Shell**: Electron 40, `electron-builder` 26 (`NSIS` + `Portable` x64 Windows targets)
- **Testing**: Built-in Node.js test runner (`node --test`) covering engines, integration normalizers, application services, and Electron security configuration

---

## Project Structure

```text
.
├── assets/                   # Application icons (.ico)
├── docs/                     # Engine specifications, PRD, and architecture docs
├── electron/
│   ├── main.cjs              # Main process: window lifecycle, tray, disk JSON, notifications
│   └── preload.cjs           # Sandboxed contextBridge IPC API (multiCalDesktop)
├── src/
│   ├── application/          # Calendar service orchestration & Sanatan/ISKCON modes
│   ├── core/                 # Astronomical math & time utilities
│   ├── data-model/           # Shared domain types
│   ├── engines/              # 4 independent engines (bd-national, bd-bengali, india-bengali, iskcon-mayapur)
│   ├── integration/          # Registry, CalendarManager, Phase 5B unified normalizers
│   ├── ui/
│   │   ├── main.tsx          # App shell, navigation, Home timeline & desktop sync
│   │   ├── MyAgendaView.tsx  # Personal agendas workspace
│   │   ├── ScheduleView.tsx  # Daily schedule timeline & creation workspace
│   │   ├── RingClockPicker.tsx # 12-hour dual-handle SVG ring clock + AM/PM switchers
│   │   ├── agendas.ts        # Agenda domain logic & multiCalDesktop typings
│   │   ├── schedules.ts      # Schedule status, 10m tick window & start-to-start progress logic
│   │   ├── i18n.ts           # Bengali & English translations
│   │   ├── shared.tsx        # Shared helpers, date utilities & SVG icon set
│   │   └── styles.css        # Design tokens, themes, and responsive layout rules
│   └── validation/           # Optional BanglaDateToday external comparison client
└── tests/
    ├── application/          # Service-level tests
    ├── calendar/             # Engine accuracy & astronomical tests
    ├── desktop/              # Electron config & preload security tests
    └── integration/          # Normalizer & registry tests
```

---

## Getting Started

### Prerequisites

- **Node.js** `20+`
- **npm** `10+`
- **Windows 10/11** recommended for building NSIS installers and testing Windows packaging

### Installation

```bash
npm install
```

### Run Web Development Server

```bash
npm run dev
```

Starts Vite on `http://localhost:3000`.

### Run Electron Desktop in Development

```bash
npm run electron:dev
```

Launches Vite on `127.0.0.1:5173` and opens the MultiCal Electron window once ready.

---

## Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Run the Vite web development server on port `3000` |
| `npm run build` | Type-check (`tsc`) and build production bundle into `dist/` |
| `npm run lint` | Run TypeScript type checks without emitting files |
| `npm test` | Compile TypeScript and execute all 77 automated unit & desktop tests |
| `npm run electron:dev` | Run Vite + Electron desktop app together in development mode |
| `npm run electron:start` | Launch Electron directly against built `dist/` |
| `npm run build:desktop` | Build `dist/` and package both Windows NSIS installer and portable `.exe` |
| `npm run build:installer` | Build Windows NSIS installer only |
| `npm run build:portable` | Build Windows portable executable only |

Packaged desktop outputs are generated in `release/`:
- `MultiCal-0.2.0-x64.exe`
- `MultiCal-0.2.0-portable-x64.exe`

---

## Offline Behavior & Data Coverage

- **Offline Ready**: All four calendar calculations, Panchang computations, personal agendas, and schedules run locally without internet access.
- **External Validation**: The optional Bangladesh Bengali date check uses `BanglaDateToday` when online and treats external responses as comparison-only without altering internal engine dates.
- **Dataset Scope**: Bundled Bangladesh national holiday records currently cover `2026–2027`; astronomical and observance calculations follow each engine's documented specification.

---

## Documentation

Additional technical documentation is available in [`docs/`](docs/):

- [Working Converter UI](docs/WORKING_CONVERTER_UI.md)
- [Desktop App Architecture](docs/DESKTOP_APP.md)
- [Calendar Integration & Unified Date Model](docs/CALENDAR_INTEGRATION.md)
- [Bangladesh National Engine](docs/BD_NATIONAL_ENGINE.md)
- [Bangladesh Bengali Engine](docs/BD_BENGALI_ENGINE.md)
- [India Bengali Engine](docs/INDIA_BENGALI_ENGINE.md)
- [ISKCON Mayapur Engine](docs/ISKCON_MAYAPUR_ENGINE.md)
- [Data Sources](docs/DATA_SOURCES.md)
