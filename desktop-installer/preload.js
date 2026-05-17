const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronDesktop", {
  isDesktop: true,
  openFileDialog(options) {
    return ipcRenderer.invoke("dialog:open-file", options);
  },
  chooseDataDirectory() {
    return ipcRenderer.invoke("dialog:choose-directory");
  },
  readDataFile(directoryPath, fileName) {
    return ipcRenderer.invoke("data-directory:read-file", directoryPath, fileName);
  },
  writeDataFile(directoryPath, fileName, contents) {
    return ipcRenderer.invoke("data-directory:write-file", directoryPath, fileName, contents);
  },
});
