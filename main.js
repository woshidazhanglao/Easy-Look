const { app, BrowserWindow } = require('electron');
const path = require('path');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    resizable: false,
    icon: path.join(__dirname, './src/eye.png'),
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false, 
      preload: './preload.js', 
    },
  });

  win.removeMenu();

  win.webContents.on('before-input-event', (event, input) => {
    if (
      (input.key === 'I' && input.control && input.shift) || // Ctrl+Shift+I
      input.key === 'F12'
    ) {
      event.preventDefault();
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
