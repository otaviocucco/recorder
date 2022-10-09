const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Store = require('./Store')

const preferences = new Store({
    configName: 'user-preferences',
    defaults: {
        destination: path.join(os.homedir(), 'audios')
    }
})

let destination = preferences.get("destination")

const isMac = process.platform === 'darwin' ? true : false;

function createPreferencesWindow() {
    const preferenceWin = new BrowserWindow({
        width: 600,
        height: 150,
        resizable: false,
        backgroundColor: '#234',
        show: false,
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });


    preferenceWin.loadFile('./src/preferences/index.html')

    // preferenceWin.webContents.openDevTools();

    preferenceWin.once('ready-to-show', () => {
        preferenceWin.show();
        preferenceWin.webContents.send('dest-path-update', destination);
    });

}

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 300,
        resizable: false,
        backgroundColor: '#234',
        show: false,
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('./src/mainWindow/index.html');

    // win.webContents.openDevTools();

    win.once('ready-to-show', () => {
        win.show();
    });

    const menuTemplate = [
        {
            label: app.name,
            submenu: [
                { label: 'Preferences', click: () => { createPreferencesWindow() } },
                { label: 'Open destination folder', click: () => { shell.openPath(destination) } }
            ]
        },
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


ipcMain.on("save_buffer", (e, buffer) => {
    const filePath = path.join(destination, `${Date.now()}`);
    fs.writeFileSync(`${filePath}.webm`, buffer);
})

ipcMain.handle("show-dialog", async (event) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })

    const dirPath = result.filePaths[0]

    preferences.set("destination", dirPath);
    destination = preferences.get("destination");

    return destination;
})