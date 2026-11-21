const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("multiCalDesktop", {
  isDesktop: true,
  loadAgendas: () => ipcRenderer.invoke("multical:agendas:load"),
  saveAgendas: agendas => ipcRenderer.invoke("multical:agendas:save", agendas),
  loadSchedules: () => ipcRenderer.invoke("multical:schedules:load"),
  saveSchedules: schedules => ipcRenderer.invoke("multical:schedules:save", schedules),
  loadTasks: () => ipcRenderer.invoke("multical:tasks:load"),
  saveTasks: payload => ipcRenderer.invoke("multical:tasks:save", payload),
  setLanguage: lang => ipcRenderer.send("multical:language", lang),
  onOpenMyAgenda: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("multical:open-my-agenda", listener);
    return () => ipcRenderer.removeListener("multical:open-my-agenda", listener);
  },
  onOpenSchedule: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("multical:open-schedule", listener);
    return () => ipcRenderer.removeListener("multical:open-schedule", listener);
  },
  onOpenLiveTask: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("multical:open-live-task", listener);
    return () => ipcRenderer.removeListener("multical:open-live-task", listener);
  },
  onSchedulesUpdated: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, list) => callback(list);
    ipcRenderer.on("multical:schedules-updated", listener);
    return () => ipcRenderer.removeListener("multical:schedules-updated", listener);
  },
  onTasksUpdated: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("multical:tasks-updated", listener);
    return () => ipcRenderer.removeListener("multical:tasks-updated", listener);
  }
});
