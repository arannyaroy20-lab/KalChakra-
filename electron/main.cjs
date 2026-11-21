const { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, shell, Tray } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  buildWindowsGotItToastXml,
  dhakaNow,
  evaluateDesktopReminders,
  parseGotItProtocolUrl
} = require("./reminders.cjs");

const isDevelopment = !app.isPackaged;
const DEV_SERVER_URL = "http://127.0.0.1:5173";

if (process.platform === "win32") {
  app.setAppUserModelId("com.multical.calendar");
  if (app.isPackaged) {
    app.setAsDefaultProtocolClient("multical");
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let agendasCache = [];
let schedulesCache = [];
let tasksStoreCache = { tasks: [], goals: {}, campaigns: [] };
let uiLanguage = "bn";
const notifiedToday = new Set();

function agendasFilePath() {
  return path.join(app.getPath("userData"), "agendas.json");
}

function schedulesFilePath() {
  return path.join(app.getPath("userData"), "schedules.json");
}

function tasksFilePath() {
  return path.join(app.getPath("userData"), "tasks.json");
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filePath, list) {
  const safe = Array.isArray(list) ? list : [];
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(safe, null, 2), "utf8");
  return safe;
}

async function readAgendasFromDisk() {
  return readJsonArray(agendasFilePath());
}

async function writeAgendasToDisk(list) {
  agendasCache = await writeJsonArray(agendasFilePath(), list);
}

async function readSchedulesFromDisk() {
  return readJsonArray(schedulesFilePath());
}

async function writeSchedulesToDisk(list) {
  schedulesCache = await writeJsonArray(schedulesFilePath(), list);
}

async function readTasksFromDisk() {
  try {
    const raw = await fs.readFile(tasksFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : [],
      goals: parsed?.goals && typeof parsed.goals === "object" && !Array.isArray(parsed.goals) ? parsed.goals : {},
      campaigns: Array.isArray(parsed?.campaigns) ? parsed.campaigns : []
    };
  } catch {
    return { tasks: [], goals: {}, campaigns: [] };
  }
}

async function writeTasksToDisk(payload) {
  const safe = {
    tasks: Array.isArray(payload?.tasks) ? payload.tasks : [],
    goals: payload?.goals && typeof payload.goals === "object" && !Array.isArray(payload.goals) ? payload.goals : {},
    campaigns: Array.isArray(payload?.campaigns) ? payload.campaigns : []
  };
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(tasksFilePath(), JSON.stringify(safe, null, 2), "utf8");
  tasksStoreCache = safe;
  return safe;
}

async function markScheduleDoneFromNotification(id, isoDate) {
  const next = schedulesCache.map(item => {
    if (!item || item.id !== id) return item;
    const prev = Array.isArray(item.completedDates) ? item.completedDates : [];
    if (prev.includes(isoDate)) return item;
    return { ...item, completedDates: [...prev, isoDate] };
  });
  await writeSchedulesToDisk(next);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("multical:schedules-updated", schedulesCache);
  }
}

function showOsNotification({ title, body, channel, gotItScheduleId, iso, onGotIt }) {
  const iconPath = path.join(__dirname, "..", "assets", "icon.ico");
  const useWindowsGotItXml =
    Boolean(onGotIt && gotItScheduleId && iso && process.platform === "win32" && app.isPackaged);
  const options = useWindowsGotItXml
    ? {
        toastXml: buildWindowsGotItToastXml({
          title,
          body,
          scheduleId: gotItScheduleId,
          iso,
          gotItText: "Got it"
        })
      }
    : {
        title,
        body,
        icon: iconPath,
        ...(onGotIt && process.platform === "darwin" ? { actions: [{ type: "button", text: "Got it" }] } : {})
      };
  const notice = new Notification(options);
  notice.on("click", () => openRendererView(channel));
  if (onGotIt) {
    notice.on("action", () => { void onGotIt(); });
  }
  notice.show();
}

async function runDesktopReminders({ includeAgendaAndSchedule = true } = {}) {
  const { iso, minutes, nowMs } = dhakaNow();
  const canNotify = Notification.isSupported();
  const result = evaluateDesktopReminders({
    agendas: agendasCache,
    schedules: schedulesCache,
    tasks: tasksStoreCache.tasks,
    iso,
    minutes,
    nowMs,
    lang: uiLanguage,
    notifiedKeys: notifiedToday,
    includeAgendaAndSchedule
  });

  if (result.tasksChanged) {
    await writeTasksToDisk({
      tasks: result.nextTasks,
      goals: tasksStoreCache.goals,
      campaigns: tasksStoreCache.campaigns
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("multical:tasks-updated", tasksStoreCache);
    }
  }

  if (!canNotify) return;
  for (const item of result.notifications) {
    showOsNotification({
      title: item.title,
      body: item.body,
      channel: item.channel,
      gotItScheduleId: item.gotItScheduleId,
      iso: item.iso,
      onGotIt: item.gotItScheduleId
        ? () => markScheduleDoneFromNotification(item.gotItScheduleId, item.iso || iso)
        : undefined
    });
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

function openRendererView(channel) {
  focusMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once("did-finish-load", () => {
        mainWindow.webContents.send(channel);
      });
    } else {
      mainWindow.webContents.send(channel);
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
      { label: "My Agenda", click: () => openRendererView("multical:open-my-agenda") },
      { label: "Schedule", click: () => openRendererView("multical:open-schedule") },
      { label: "Live Task", click: () => openRendererView("multical:open-live-task") },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]));
    tray.on("click", () => focusMainWindow());
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
  window.on("close", event => {
    if (!isQuitting && tray) {
      event.preventDefault();
      window.hide();
    }
  });
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

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("second-instance", (_event, commandLine) => {
  const protocolArg = Array.isArray(commandLine)
    ? commandLine.find(arg => typeof arg === "string" && arg.startsWith("multical://"))
    : null;
  if (protocolArg) {
    const gotIt = parseGotItProtocolUrl(protocolArg);
    if (gotIt) {
      void markScheduleDoneFromNotification(gotIt.scheduleId, gotIt.iso);
      return;
    }
    if (protocolArg.startsWith("multical://open-schedule")) {
      openRendererView("multical:open-schedule");
      return;
    }
  }
  focusMainWindow();
});

app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return;

  agendasCache = await readAgendasFromDisk();
  schedulesCache = await readSchedulesFromDisk();
  tasksStoreCache = await readTasksFromDisk();

  ipcMain.handle("multical:agendas:load", async () => {
    agendasCache = await readAgendasFromDisk();
    return agendasCache;
  });
  ipcMain.handle("multical:agendas:save", async (_event, list) => {
    await writeAgendasToDisk(list);
    void runDesktopReminders();
    return true;
  });
  ipcMain.handle("multical:schedules:load", async () => {
    schedulesCache = await readSchedulesFromDisk();
    return schedulesCache;
  });
  ipcMain.handle("multical:schedules:save", async (_event, list) => {
    await writeSchedulesToDisk(list);
    void runDesktopReminders();
    return true;
  });
  ipcMain.handle("multical:tasks:load", async () => {
    tasksStoreCache = await readTasksFromDisk();
    return tasksStoreCache;
  });
  ipcMain.handle("multical:tasks:save", async (_event, payload) => {
    await writeTasksToDisk(payload);
    void runDesktopReminders();
    return true;
  });
  ipcMain.on("multical:language", (_event, lang) => {
    if (lang === "bn" || lang === "en") uiLanguage = lang;
  });

  createWindow();
  setupTray();
  void runDesktopReminders();
  setInterval(() => { void runDesktopReminders(); }, 15_000);
  setInterval(() => {
    if (tasksStoreCache.tasks.some(t => t && t.status === "running") || schedulesCache.some(s => s && s.campaignId)) {
      void runDesktopReminders({ includeAgendaAndSchedule: false });
    }
  }, 5_000);

  app.on("activate", () => {
    focusMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (isQuitting || !tray) {
    if (process.platform !== "darwin") app.quit();
  }
});
