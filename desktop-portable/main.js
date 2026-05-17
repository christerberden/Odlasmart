const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain, session, shell } = require("electron");

function getWebRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web");
  }
  return path.resolve(__dirname, "..");
}

function createWindow() {
  const webRoot = getWebRoot();
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f5f1e8",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(webRoot, "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "geolocation") {
      callback(true);
      return;
    }
    callback(false);
  });

  ipcMain.handle("dialog:open-file", async (_event, options) => {
    return dialog.showOpenDialog(options);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
