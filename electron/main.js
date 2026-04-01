const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Disable sandbox for Linux development (sandbox requires root-owned chrome-sandbox)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
  app.commandLine.appendSwitch('--disable-dev-shm-usage');
  app.commandLine.appendSwitch('--disable-gpu');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
}


// Import handlers from your handlers folder
const { loginHandler } = require(join(__dirname, '../dist/src/lib/handlers/loginHandler'));
const { chairsHandler } = require(join(__dirname, '../dist/src/lib/handlers/chairsHandler'));
const { fileHandler } = require(join(__dirname, '../dist/src/lib/handlers/fileHandler'));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js') // If you use a preload script
    }
  })

  // Enable DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  if (isDev) {
    // Wait a bit for the dev server to be ready
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 1000)
  } else {
    mainWindow.loadFile(join(__dirname, '../out/index.html'))
  }

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, errorDescription)
    // Retry loading after a delay in development
    if (isDev) {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000')
      }, 2000)
    }
  })
}

// IPC handler for login
ipcMain.handle('login', async (event, { username, password }) => {
  return await loginHandler(username, password);
});

// IPC handler for chairs
ipcMain.handle('get-chairs', async (event, { sessionId }) => {
  return await chairsHandler(sessionId);
});

// IPC handler for file download
ipcMain.handle('get-file', async (event, params) => {
  return await fileHandler(params);
});

app.whenReady().then(createWindow)