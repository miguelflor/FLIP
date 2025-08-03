const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
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
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
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

app.whenReady().then(createWindow)