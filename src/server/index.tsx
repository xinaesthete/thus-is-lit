import { app, BrowserWindow } from 'electron'
import * as path from 'path'

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
    });
    window.loadURL(`file://${__dirname}/gui.html`);
}

function createRendererWindow() {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        fullscreen: true
    });
    //would be good to have a saved configuration 
    //and use that to create sets of windows each on correct screens.
    //nb may go back to old organic-art method of making one big borderless window
    //spanning entire extended desktop
    window.loadURL(`file://${__dirname}/renderer.html`);
}

app.on("ready", createGUIWindow);