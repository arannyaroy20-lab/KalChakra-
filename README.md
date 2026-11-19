
<div align="center">

# KalChakra

**A multilingual calendar companion for Bengali dates, regional calendars, and traditional observances.**

[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://github.com/arannyaroy20-lab/KalChakra-)
[![Built with](https://img.shields.io/badge/built%20with-React%20%7C%20TypeScript-3178C6)](https://www.typescriptlang.org/)
[![Desktop](https://img.shields.io/badge/desktop-Electron-47848F)](https://www.electronjs.org/)

</div>

---

## About

KalChakra is a calendar application that brings multiple Bengali and regional calendar systems together in one place. It is designed to make date conversion and calendar information easier to explore through a Bengali- and English-language interface.

Each calendar system uses its own calculation rules and data. The application keeps those systems separate rather than treating them as interchangeable.

## Calendar systems

| Calendar | What it provides |
|---|---|
| **Bangladesh National Calendar** | National dates, events, and holidays |
| **Bangladesh Bengali Calendar** | Gregorian ↔ Bengali date conversion based on the revised Bangla Academy calendar |
| **India Bengali Calendar** | West Bengal-style Bangabda date conversion and Panchang-related calculations |
| **ISKCON Mayapur Calendar** | Mayapur Panchang information, sunrise/sunset data, and Vaishnava observances |

### Application features

- Bengali and English interface
- Gregorian month navigation and date selection
- Daily and monthly calendar information
- Separate calculation engines for the supported calendar systems
- Windows desktop application powered by Electron
- Local calendar calculations and bundled data where available

## Download

Visit the **[Releases](https://github.com/arannyaroy20-lab/KalChakra-/releases)** page to find available Windows builds.

Depending on the release, downloads may include:

- **Installer** — installs the application on Windows.
- **Portable version** — runs without a traditional installation.

Always check the release notes for version-specific changes and known limitations.

## Getting started

### Requirements

- Windows for the desktop application
- [Node.js](https://nodejs.org/) and npm for development

### Run locally

Clone the repository and install its dependencies:

```bash
git clone https://github.com/arannyaroy20-lab/KalChakra-.git
cd KalChakra-
npm install
```

Start the web development server:

```bash
npm run dev
```

Start the Electron desktop application in development mode:

```bash
npm run electron:dev
```

## Development commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run the test suite |
| `npm run build` | Build the application |
| `npm run electron:dev` | Run the Electron app with the Vite development server |
| `npm run build:desktop` | Build Windows installer and portable packages |
| `npm run build:installer` | Build the Windows installer |
| `npm run build:portable` | Build the portable Windows executable |

Packaged desktop builds are written to the `release/` directory.

## Technology

- **React** — user interface
- **TypeScript** — application logic and type safety
- **Vite** — development server and frontend build
- **Electron** — Windows desktop runtime
- **electron-builder** — desktop packaging

## Accuracy and data notes

Calendar systems follow different regional conventions and calculation methods. Their available operations are therefore not identical.

- Bangladesh National Calendar data currently includes 2026–2027.
- Bengali calendar engines do not currently provide a complete curated event dataset.
- India Bengali and Mayapur astronomical calculations are analytical approximations; they should not be treated as certified output from a specific Panjika publisher or official ISKCON calendar.
- Mayapur Gaurabda dates are not currently provided.
- Some reference links and optional validation features require an internet connection.

For religious observances or other date-sensitive decisions, consult the relevant official or local calendar source as well.

## Project status

KalChakra is under active development. Features, supported date ranges, and calculation accuracy may change between releases. Check the [Issues](https://github.com/arannyaroy20-lab/KalChakra-/issues) and [Releases](https://github.com/arannyaroy20-lab/KalChakra-/releases) pages for updates.

## Contributing

Bug reports, suggestions, and contributions are welcome. If you find an incorrect date or calculation, please include:

1. The calendar system selected
2. The date you checked
3. The result you expected
4. The result shown by the application

This makes issues easier to investigate.

## License

No license has been specified yet. Until a license is added to this repository, the default copyright rules apply; please do not assume the code is open for reuse or redistribution.
