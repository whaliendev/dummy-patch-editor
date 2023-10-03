"use strict";
const electron = require("electron");
const node_os = require("node:os");
const node_path = require("node:path");
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
process.env.DIST_ELECTRON = node_path.join(__dirname, "..");
process.env.DIST = node_path.join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? node_path.join(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
const logFilePath = path.join(os.homedir(), ".local", "share", "dummy-patch-editor", "electron-debug.log");
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}
function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}
`);
}
if (node_os.release().startsWith("6.1"))
  electron.app.disableHardwareAcceleration();
if (process.platform === "win32")
  electron.app.setAppUserModelId(electron.app.getName());
if (!electron.app.requestSingleInstanceLock()) {
  electron.app.quit();
  process.exit(0);
}
let win = null;
const preload = node_path.join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = node_path.join(process.env.DIST, "index.html");
async function createWindow() {
  win = new electron.BrowserWindow({
    title: "Main window",
    icon: node_path.join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: false,
      contextIsolation: true
    },
    width: 1120,
    height: 680
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", new Date().toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:"))
      electron.shell.openExternal(url2);
    return { action: "deny" };
  });
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin")
    electron.app.quit();
});
electron.app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized())
      win.restore();
    win.focus();
  }
});
electron.app.on("activate", () => {
  const allWindows = electron.BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
electron.ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new electron.BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
electron.ipcMain.handle("select-directory", async () => {
  const result = await electron.dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, directory: result.filePaths[0] };
  }
  return {
    success: false,
    error: "Directory selection was canceled or no directory was selected."
  };
});
electron.ipcMain.on("load-conflict-sources", (event, repoPath) => {
  logToFile(`Received repoPath: ${repoPath}`);
  if (!fs.existsSync(repoPath)) {
    event.reply(
      "load-conflict-sources-error",
      "Provided repository path does not exist."
    );
    return;
  }
  if (!fs.statSync(repoPath).isDirectory()) {
    event.reply(
      "load-conflict-sources-error",
      "Provided path is not a directory."
    );
    return;
  }
  const gitDir = path.join(repoPath, ".git");
  if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
    event.reply(
      "load-conflict-sources-error",
      "Provided path does not seem to be a valid git repository."
    );
    return;
  }
  logToFile(`gitDir: ${gitDir}`);
  child_process.exec(
    "git diff --name-only --diff-filter=U",
    { cwd: repoPath },
    (error, stdout, stderr) => {
      if (error) {
        logToFile(
          `Error executing git command: ${stderr || "Unknown error occurred."}`
        );
        event.reply(
          "load-conflict-sources-error",
          stderr || "Unknown error occurred."
        );
        return;
      }
      const files = stdout.split("\n").filter((file) => file.trim() !== "");
      logToFile(`Found files: ${files.join(", ")}`);
      event.reply("load-conflict-sources-success", files);
    }
  );
});
electron.ipcMain.handle("join-path", (event, ...paths) => {
  return path.join(...paths);
});
electron.ipcMain.handle("read-file", (event, filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.split("\n"));
      }
    });
  });
});
//# sourceMappingURL=index.js.map
