const { app, BrowserWindow, ipcMain } = require('electron');
// console.log(app)

const path = require('path');
// console.log(path)

let win;
const createWindow = () => {
  win = new BrowserWindow({
    width: 450,
    height: 300,
    // frame: false,
    // transparent: true,
    // enabled: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  win.loadFile(path.join(__dirname,'../../index.html'));
}


/////////
// APP //
/////////
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


//////////////
// IPC MAIN //
//////////////
ipcMain.on('hide', () => {
  win.setAlwaysOnTop(false);
  win.blur();
});

ipcMain.on('show', () => {
  win.setAlwaysOnTop(true);
  win.show();
});

ipcMain.on('title', (e, ttl) => {
  win.setTitle(ttl);
});