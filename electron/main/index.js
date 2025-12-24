import {
  app,
  BrowserWindow,
  globalShortcut,
  shell,
  ipcMain,
  screen,
  Menu,
} from "electron";
import DBService from "../../src/utils/database";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
let win = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
//初始化数据库
function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "ganttchat.db");
  console.log(dbPath);
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      project TEXT NOT NULL,
      startdate TEXT NOT NULL,
      enddate TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    width: Math.floor(width * 0.9), // 屏幕宽度的80%
    height: Math.floor(height * 0.9), // 屏幕高度的80%
    x: Math.floor(width * 0.05), // 水平居中
    y: Math.floor(height * 0.05),
    // minWidth: 1200,    // 最小宽度
    // minHeight: 800,   // 最小高度
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    autoHideMenuBar: false,
    webPreferences: {
      preload,
    },
  });
  // 允许窗口调整大小，用户html监听窗口大小变化，动态刷新组件
  win.on("resize", () => {
    const size = win.getSize();
    win.webContents.send("window-resized", { width: size[0], height: size[1] });
  });
  win.setTitle("GANTT CHAT");
  //去掉菜单栏
  Menu.setApplicationMenu(null);
  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}
// function registerShortcuts() {
//   // Ctrl+F12 打开开发者工具
//   globalShortcut.register('Ctrl+F12', () => {
//     if(win){
//       const isOpen = win.webContents.isDevToolsOpened()
//       if(isOpen){
//         win.webContents.closeDevTools()
//       }else{
//         win.webContents.openDevTools()
//       }
//     }
//   })
//   globalShortcut.register('Ctrl+F', () => {
//     if(win){
//       win.reload()
//     }
//   })
//   globalShortcut.register('Esc', () => {
//     app.quit()
//   })
// }
app.whenReady().then(() => {
  //快捷键注册
  // registerShortcuts()
  DBService.initialize();
  createWindow();
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") {
    app.quit();
    globalShortcut.unregisterAll();
  }
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
// 应用关闭时关闭数据库连接
app.on("before-quit", () => {
  DBService.close();
});
//退出应用
ipcMain.on("close-app", () => {
  app.quit();
});
// 打开devtools
ipcMain.on("open-devtools", () => {
  if (win) {
    const isOpen = win.webContents.isDevToolsOpened();
    if (isOpen) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools();
    }
  }
});
// 刷新窗口
ipcMain.on("reload-app", () => {
  win.reload();
});
// 初始化窗口尺寸
ipcMain.handle("win-size", () => {
  if (win) {
    return win.getContentSize();
  }
});

ipcMain.handle("database:insertProject", async (event, data) => {
  return DBService.insertProject(data);
});
ipcMain.handle("database:selectProjects", async (event, data) => {
  return DBService.selectProjects(data);
});
ipcMain.handle("database:insertPersonnel", async (event, data) => {
  return DBService.insertPersonnel(data);
});
ipcMain.handle("database:insertProjectName", async (event, data) => {
  return DBService.insertProjectName(data);
});
ipcMain.handle("database:selectPersonnel", async (event, data) => {
  return DBService.selectPersonnel();
});
ipcMain.handle("database:selectProjectNames", async (event, data) => {
  return DBService.selectProjectNames();
});
ipcMain.handle("database:updateProject", async (event, data) => {
  return DBService.updateProject(data);
});
ipcMain.handle("database:deleteProject", async (event, data) => {
  console.log("+++++++++++++++++++");
  return DBService.deleteProject(data);
});
ipcMain.handle("database:deleteProjects", async (event, data) => {
  console.log("&&&&&&&&&&&&&&&&&&&&&&&");
  return DBService.deleteProjects(data);
});
ipcMain.handle("database:selectHomeData", async (event, data) => {
  return DBService.selectHomeData(data);
});
ipcMain.handle("database:clearCache", async (event, data) => {
  return DBService.clearCache(data);
});
