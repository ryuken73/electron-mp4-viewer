const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const {autoUpdater} = require("electron-updater");
const {ipcMain} = require('electron');

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  // mainWindow = new BrowserWindow({width: 1280, height: 840, backgroundColor:'#2e2c29'})
  mainWindow = new BrowserWindow({width: 1280, height: 880, backgroundColor:'#222'})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';
log.info('App starting.....')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  createWindow();
  if(!isDev()){
    log.info('production mode');
    autoUpdater.checkForUpdates();
    //autoUpdater.checkForUpdatesAndNotify();
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// when the update has been downloaded and is ready to be installed, notify the BrowserWindow
/*
autoUpdater.on('checking-for-update', () => {
  mainWindow.webContents.send('checkStart')
});
*/

autoUpdater.on('update-available', (info) => {
  log.info(info)
  mainWindow.webContents.send('updateAvail')
});

autoUpdater.on('update-not-available', (info) => {
  log.info(info)
  mainWindow.webContents.send('updateNotAvail')
});

autoUpdater.on('download-progress', (progressInfo) => {
  log.info(progressInfo)
  mainWindow.webContents.send('progress')
});

autoUpdater.on('update-downloaded', (info) => {
  log.info(info)
  mainWindow.webContents.send('updateReady')
});

autoUpdater.on('error', (err) => {
  mainWindow.webContents.send('updateErr')
});

// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
})

ipcMain.on('progress', (event, arg) => {
  log.info(arg.progress)
  log.info(arg.mode)
  mainWindow.setProgressBar(arg.progress, {mode : arg.mode});
})

function isDev() {
  return process.mainModule.filename.indexOf('app.asar') === -1;
}