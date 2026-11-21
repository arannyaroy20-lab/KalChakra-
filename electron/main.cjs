const { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, shell, Tray } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const isDevelopment = !app.isPackaged;
const DEV_SERVER_URL = "http://127.0.0.1:5173";

let mainWindow = null;
let tray = null;
let agendasCache = [];
let uiLanguage = "bn";
const notifiedToday = new Set();

function agendasFilePath() {
  return path.join(app.getPath("userData"), "agendas.json");
}

async function readAgendasFromDisk() {
  try {
    const raw = await fs.readFile(agendasFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAgendasToDisk(list) {
  const safe = Array.isArray(list) ? list : [];
  agendasCache = safe;
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(agendasFilePath(), JSON.stringify(safe, null, 2), "utf8");
}

function dhakaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type)?.value ?? "00";
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { iso, minutes };
}

function parseYmd(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { y, m, d, wd: dt.getUTCDay() };
}

function daysInMonthUtc(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function matchesDate(agenda, isoDate) {
  if (!agenda || typeof agenda.date !== "string" || isoDate < agenda.date) return false;
  if (agenda.repeat === "once") return isoDate === agenda.date;
  const start = parseYmd(agenda.date);
  const target = parseYmd(isoDate);
  if (agenda.repeat === "weekly") return target.wd === start.wd;
  if (agenda.repeat === "monthly") return target.d === Math.min(start.d, daysInMonthUtc(target.y, target.m));
  if (agenda.repeat === "yearly") return target.m === start.m && target.d === Math.min(start.d, daysInMonthUtc(target.y, target.m));
  if (agenda.repeat === "weekdays") return Array.isArray(agenda.weekdays) && agenda.weekdays.includes(target.wd);
  return false;
}

function checkAgendaReminders() {
  if (!Notification.isSupported() || !agendasCache.length) return;
  const { iso, minutes } = dhakaNow();

  for (const key of notifiedToday) {
    if (!key.endsWith(`:${iso}`)) notifiedToday.delete(key);
  }

  for (const agenda of agendasCache) {
    if (!agenda || !agenda.reminder || !matchesDate(agenda, iso)) continue;
    const key = `${agenda.id}:${iso}`;
    if (notifiedToday.has(key)) continue;

    let due = false;
    if (agenda.isAllDay || !agenda.time) {
      due = minutes >= 8 * 60 && minutes <= 22 * 60;
    } else if (/^\d{2}:\d{2}$/.test(agenda.time)) {
      const [hh, mm] = agenda.time.split(":").map(Number);
      const targetMins = hh * 60 + mm;
      due = minutes >= targetMins && minutes <= targetMins + 2;
    }

    if (!due) continue;
    notifiedToday.add(key);

    const body = agenda.comment && String(agenda.comment).trim()
      ? String(agenda.comment).trim()
      : (uiLanguage === "bn" ? "আজকের নির্ধারিত এজেন্ডা রিমাইন্ডার" : "Scheduled agenda reminder for today");

    const notice = new Notification({
      title: agenda.title || "MultiCal",
      body,
      icon: path.join(__dirname, "..", "assets", "icon.ico")
    });
    notice.on("click", () => openMyAgendaWindow());
    notice.show();
  }
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function openMyAgendaWindow() {
  focusMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once("did-finish-load", () => {
        mainWindow.webContents.send("multical:open-my-agenda");
      });
    } else {
      mainWindow.webContents.send("multical:open-my-agenda");
    }
  }
}

function setupTray() {
  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, "..", "assets", "icon.ico"));
    if (icon.isEmpty()) return;
    tray = new Tray(icon);
    tray.setToolTip("MultiCal");
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "Open MultiCal", click: () => focusMainWindow() },
      { label: "My Agenda", click: () => openMyAgendaWindow() },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() }
    ]));
    tray.on("double-click", () => focusMainWindow());
  } catch {
    /* tray optional across environments */
  }
}

function isAllowedNavigation(url) {
  if (isDevelopment) {
    return url === DEV_SERVER_URL || url.startsWith(`${DEV_SERVER_URL}/`);
  }
  const packagedEntry = pathToFileURL(
    path.join(__dirname, "..", "dist", "index.html")
  ).href;
  return url === packagedEntry || url.startsWith(`${packagedEntry}#`);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 680,
    title: "MultiCal",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow = window;
  window.once("ready-to-show", () => window.show());
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });

  if (isDevelopment) {
    window.loadURL(DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  return window;
}

app.whenReady().then(async () => {
  agendasCache = await readAgendasFromDisk();

  ipcMain.handle("multical:agendas:load", async () => {
    agendasCache = await readAgendasFromDisk();
    return agendasCache;
  });
  ipcMain.handle("multical:agendas:save", async (_event, list) => {
    await writeAgendasToDisk(list);
    checkAgendaReminders();
    return true;
  });
  ipcMain.on("multical:language", (_event, lang) => {
    if (lang === "bn" || lang === "en") uiLanguage = lang;
  });

  createWindow();
  setupTray();
  checkAgendaReminders();
  setInterval(checkAgendaReminders, 30_000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
