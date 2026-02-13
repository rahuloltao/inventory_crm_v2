import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Fix __dirname for ES Modules (it doesn't exist by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // Ensure the icon path is correct relative to the build
    icon: path.join(__dirname, 'public/icon.ico') 
  });

  // 2. logic to handle Dev vs Production modes correctly
  if (app.isPackaged) {
    // Production: Load the index.html from the dist folder
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    // Development: Load from the local Vite server
    mainWindow.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});