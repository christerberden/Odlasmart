const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, dialog, ipcMain, session, shell } = require("electron");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;

log.transports.file.level = "info";
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function resolveDataFilePath(directoryPath, fileName) {
  const safeName = path.basename(fileName);
  if (safeName !== fileName) {
    throw new Error("Invalid file name.");
  }
  return path.join(directoryPath, safeName);
}

function getWebRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web");
  }
  return path.resolve(__dirname, "..");
}

function createWindow() {
  const webRoot = getWebRoot();
  mainWindow = new BrowserWindow({
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

function setupAutoUpdates() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.on("error", (error) => {
    log.error("Auto-update failed", error);
  });

  autoUpdater.on("update-available", (info) => {
    log.info(`Update available: ${info.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No update available");
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info(`Update download progress: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    log.info(`Update downloaded: ${info.version}`);
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? mainWindow ?? null;
    const response = await dialog.showMessageBox(focusedWindow, {
      type: "info",
      buttons: ["Installera nu", "Senare"],
      defaultId: 0,
      cancelId: 1,
      title: "Uppdatering klar",
      message: `Version ${info.version} har laddats ner och är redo att installeras.`,
      detail: "Appen startas om för att slutföra uppdateringen.",
    });
    if (response.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    log.error("Unable to check for updates", error);
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

  ipcMain.handle("dialog:choose-directory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || !result.filePaths?.[0]) {
      return { canceled: true };
    }
    return {
      canceled: false,
      path: result.filePaths[0],
      name: path.basename(result.filePaths[0]),
    };
  });

  ipcMain.handle("data-directory:read-file", async (_event, directoryPath, fileName) => {
    const filePath = resolveDataFilePath(directoryPath, fileName);
    return fs.readFile(filePath, "utf8");
  });

  ipcMain.handle("data-directory:write-file", async (_event, directoryPath, fileName, contents) => {
    const filePath = resolveDataFilePath(directoryPath, fileName);
    await fs.mkdir(directoryPath, { recursive: true });
    await fs.writeFile(filePath, contents, "utf8");
    return { ok: true };
  });

  createWindow();
  setupAutoUpdates();

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
