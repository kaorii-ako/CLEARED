/// <reference types="vite/client" />

interface ElectronAPI {
  minimize: () => void
  close: () => void
  getPlatform: () => Promise<string>
}

interface Window {
  electronAPI?: ElectronAPI
}
