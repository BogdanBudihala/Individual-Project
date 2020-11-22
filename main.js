const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
mainWindow = null;
quitBool = true;
authInfo = {username: null, password: null};

function loadWindowByType (wintype, path) {
  switch(wintype){
    case 0:
    mainWindow = createWindow(750, 550);
    mainWindow.loadFile(path);
    break;
    case 1:
    mainWindow = createWindow(1000, 650);
    mainWindow.loadFile(path);
    break;
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

}
function createWindow(width, height){
  return new BrowserWindow({
    width: width,
    height: height,
    resizable: false,
    frame: false,
    icon: '../GUI/graphics/Hardhat.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    show: false,
  })
}

app.whenReady().then(() => {
  loadWindowByType(0, '../GUI/templates/index.html')

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) loadWindowByType(0, '../GUI/templates/index.html')
  })
})

app.on('window-all-closed', function () {
  if(quitBool){
    app.quit()
  }
  quitBool = true;
})

ipcMain.on('allowAuthentication', function (event, authenticatedAs, url) {
  authInfo.username = authenticatedAs.username;
  authInfo.password = authenticatedAs.password;
  quitBool = false;
  mainWindow.close();
  loadWindowByType(1, url);
})

ipcMain.on('allowUnauthentication', function (event){
  authInfo.username = null;
  authInfo.password = null;
  quitBool = false;
  mainWindow.close();
  loadWindowByType(0, '../GUI/templates/index.html');
})

ipcMain.on('getCurrentUser', function (event) {
  event.returnValue = authInfo;
})
