import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

// 定义日志文件路径
const logFilePath = path.join(os.homedir(), '.local', 'share', 'dummy-patch-editor', 'electron-debug.log');
if(!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

// 定义一个简单的日志函数
function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: false,
      contextIsolation: true,
    },
    width: 1120,
    height: 680,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, directory: result.filePaths[0] };
  }
  return {
    success: false,
    error: 'Directory selection was canceled or no directory was selected.',
  };
});

ipcMain.on('load-conflict-sources', (event, repoPath) => {
  logToFile(`Received repoPath: ${repoPath}`);
  // 检查路径是否存在
  if (!fs.existsSync(repoPath)) {
    event.reply(
      'load-conflict-sources-error',
      'Provided repository path does not exist.'
    );
    return;
  }

  // 检查路径是否是一个目录
  if (!fs.statSync(repoPath).isDirectory()) {
    event.reply(
      'load-conflict-sources-error',
      'Provided path is not a directory.'
    );
    return;
  }

  // 检查 .git 目录是否存在
  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
    event.reply(
      'load-conflict-sources-error',
      'Provided path does not seem to be a valid git repository.'
    );
    return;
  }

  logToFile(`gitDir: ${gitDir}`);

  // 执行 git 命令
  exec(
    'git diff --name-only --diff-filter=U',
    { cwd: repoPath },
    (error, stdout, stderr) => {
      if (error) {
        logToFile(
          `Error executing git command: ${stderr || 'Unknown error occurred.'}`
        );
        event.reply(
          'load-conflict-sources-error',
          stderr || 'Unknown error occurred.'
        );
        return;
      }
      const files = stdout.split('\n').filter((file) => file.trim() !== '');
      logToFile(`Found files: ${files.join(', ')}`);
      event.reply('load-conflict-sources-success', files);
    }
  );
});

ipcMain.handle('join-path', (event, ...paths) => {
  return path.join(...paths);
});

ipcMain.handle('read-file', (event, filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.split('\n'));
      }
    });
  });
});
