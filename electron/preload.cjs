const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("multiCalDesktop", {
  isDesktop: true,
  loadAgendas: () => ipcRenderer.invoke("multical:agendas:load"),
  saveAgendas: agendas => ipcRenderer.invoke("multical:agendas:save", agendas),
  setLanguage: lang => ipcRenderer.send("multical:language", lang),
  onOpenMyAgenda: callback => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("multical:open-my-agenda", listener);
    return () => ipcRenderer.removeListener("multical:open-my-agenda", listener);
  }
});
