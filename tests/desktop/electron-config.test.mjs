import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mainProcess = await readFile(path.join(projectRoot, "electron/main.cjs"), "utf8");
const preloadScript = await readFile(path.join(projectRoot, "electron/preload.cjs"), "utf8");
const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));

test("Electron main process uses isolated, non-Node renderer security settings", () => {
  assert.match(mainProcess, /contextIsolation:\s*true/);
  assert.match(mainProcess, /nodeIntegration:\s*false/);
  assert.match(mainProcess, /sandbox:\s*true/);
  assert.match(mainProcess, /preload:\s*path\.join\(__dirname,\s*"preload\.cjs"\)/);
  assert.match(preloadScript, /contextBridge\.exposeInMainWorld\("multiCalDesktop"/);
  assert.doesNotMatch(preloadScript, /exposeInMainWorld\([^,]+,\s*\{[\s\S]*\bipcRenderer\s*[,:}]/);
});

test("Electron loads Vite in development and packaged dist in production", () => {
  assert.match(mainProcess, /window\.loadURL\(DEV_SERVER_URL\)/);
  assert.match(mainProcess, /window\.loadFile\(path\.join\(__dirname,\s*"\.\.",\s*"dist",\s*"index\.html"\)\)/);
  assert.equal(packageJson.main, "electron/main.cjs");
});

test("Windows installer and portable targets are configured", () => {
  const targets = packageJson.build.win.target.map((item) => item.target);
  assert.ok(targets.includes("nsis"));
  assert.ok(targets.includes("portable"));
  assert.equal(packageJson.build.productName, "MultiCal");
  assert.equal(packageJson.build.asar, true);
});

test("renderer cannot open arbitrary windows; external web links are delegated", () => {
  assert.match(mainProcess, /setWindowOpenHandler/);
  assert.match(mainProcess, /shell\.openExternal/);
  assert.match(mainProcess, /return \{ action: "deny" \}/);
});
