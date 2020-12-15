import { app, BrowserWindow } from 'electron'

function createGUIWindow() {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
    });
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
}

app.on("ready", createGUIWindow);