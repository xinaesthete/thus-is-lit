import 'source-map-support/register' //evanw delivers yet again
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import {startServer} from './server_comms'
import { getNextScreen } from './screen_config';
import main_state from './main_state';
// import installReactDevtool from './devtool'

startServer();

export const buildDir = path.join(__dirname, '..');

//nb, use of this library subject to review
//also currently with hacked-in TS types https://github.com/yan-foto/electron-reload/issues/65
//which is probably a Bad Idea as it'll break build.
// import electronReload from 'electron-reload'
/// also it didn't immediately work, and is fairly simple so could maybe be either replicated, or we can use something else.
//const electronReload = require('electron-reload');
// electronReload(buildDir);

function createGUIWindow() {
    const screen = getNextScreen();
    const { x, y } = screen.bounds;
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    window.loadURL(`file://${buildDir}/gui.html`);
    main_state.mainWindow = window;

    //really slow to quit when devtools is up?
    //fairly slow anyway. hiding the window makes it feel responsive...
    //hopefully not hiding some other problem from ourselves.
    window.on('close', ()=>{console.log("quitting"); window.hide(); app.quit()});
}


app.on("ready", async () => {
    //await installReactDevtool(); //let's try getting at page in browser instead - useful to have that working.
    //https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
    createGUIWindow();
});