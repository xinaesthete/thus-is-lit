import 'source-map-support/register' //evanw delivers yet again
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import {start} from './server_comms'

start();

const buildDir = path.join(__dirname);

//nb, use of this library subject to review
//also currently with hacked-in TS types https://github.com/yan-foto/electron-reload/issues/65
//which is probably a Bad Idea as it'll break build.
// import electronReload from 'electron-reload'
/// also it didn't immediately work, and is fairly simple so could maybe be either replicated, or we can use something else.
//const electronReload = require('electron-reload');
// electronReload(buildDir);

function createGUIWindow() {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    window.loadURL(`file://${__dirname}/gui.html`);
    window.on('close', ()=>app.quit());
}


app.on("ready", createGUIWindow);