
const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "PrimarralAI",
    backgroundColor: '#020617', // Slate-950 (Dark theme default)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Carrega o arquivo principal
  win.loadFile('index.html');

  // Gerenciamento automático de permissões para Microfone (necessário para o Live Tutor)
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });

  // Remove o menu padrão para uma aparência mais limpa
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
