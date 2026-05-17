const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronDesktop", {
  openFileDialog(options) {
    return ipcRenderer.invoke("dialog:open-file", options);
  }
});
