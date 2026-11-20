# MultiCal Windows Desktop Shell

## Architecture

- React/Vite remains the renderer and owns the existing UI and calendar logic.
- `electron/main.cjs` is the Electron main process.
- No preload script is used because the renderer currently needs no privileged desktop APIs.
- Production loads `dist/index.html` via `BrowserWindow.loadFile`.
- Development loads `http://127.0.0.1:5173`.

## Security decisions

`contextIsolation`, `sandbox` are enabled and `nodeIntegration` is disabled. Renderer-created windows are denied. Explicit HTTP(S) links are delegated to the system browser. Navigation away from the local Vite server in development or the packaged `file://` app in production is blocked. Do not add Node.js APIs to the renderer; if a future feature needs privileged functionality, expose the smallest possible validated API through a context-isolated preload.

## Commands

```powershell
npm install
npm run typecheck
npm test
npm run electron:dev
```

The browser development workflow (`npm run dev`) remains unchanged.

## Windows build

```powershell
npm run build:desktop
```

This runs the TypeScript/Vite production build and electron-builder for x64 NSIS installer and portable executable targets. Output is written to `release/`.

Separate targets:

```powershell
npm run build:installer
npm run build:portable
```

## Offline notes

Bundled calendar calculations and local event data work offline within their documented coverage. Optional BanglaDateToday reference validation is network-dependent and reports offline/unavailable without replacing internal results.

## Desktop validation

`tests/desktop/electron-config.test.mjs` statically checks security preferences, development/production entry points and Windows packaging targets. These checks run as part of `npm test`. They do not replace a manual launch/install test on Windows.
