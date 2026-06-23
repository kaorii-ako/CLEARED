import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'

let win: BrowserWindow | null = null
let tray: Tray | null = null

app.commandLine.appendSwitch('disable-gpu-compositing')

function createWindow(): void {
  win = new BrowserWindow({
    width: 380,
    height: 600,
    frame: false,
    transparent: process.platform !== 'linux',
    alwaysOnTop: true,
    resizable: false,
    hasShadow: true,
    skipTaskbar: process.platform === 'linux',
    backgroundColor: '#08090d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createTray()
}

function createTray(): void {
  const size = 16
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
    <rect width="16" height="16" rx="3" fill="#08090d"/>
    <path d="M12 8v-1l-5-3V2.5C7 2.1 6.6 1.7 6.2 1.7S5.4 2.1 5.4 2.5V4l-5 3v1l5-1.5V9l-1.2.9V11l2.1-.6 2.1.6V9.9L9 9V6.5l5 1.5z" fill="#e8a020"/>
  </svg>`
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml,${encodeURIComponent(svg)}`)
  tray = new Tray(icon)
  tray.setToolTip('CLEARED')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show CLEARED', click: () => win?.show() },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
  tray.on('click', () => win?.show())
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window-minimize', () => win?.minimize())
ipcMain.on('window-close', () => win?.close())
ipcMain.handle('get-platform', () => process.platform)
