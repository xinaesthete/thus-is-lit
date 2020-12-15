import { BrowserWindow } from 'electron';
import express from 'express'

const expApp = express();
const port = 8321;

async function createRendererWindow() {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        fullscreen: true
    });
    //would be good to have a saved configuration 
    //and use that to create sets of windows each on correct screens.
    //nb may go back to old organic-art method of making one big borderless window
    //spanning entire extended desktop
    await window.loadURL(`file://${__dirname}/renderer.html`);
    
    //establish communication link here...
    
    return;
}

expApp.get('/newRenderer', async (req, res) => {
    console.log("newRenderer request received");
    await createRendererWindow();
    res.send('new renderer created'); //we could send an ID to use for communication...
});

expApp.listen(port, () => {
    console.log(`express server listening at http://localhost:${port}`);
})

export function start() {

}

