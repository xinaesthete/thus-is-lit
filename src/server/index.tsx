import 'source-map-support/register' //evanw delivers yet again
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import {startServer} from './server_comms'
import { getNextScreen } from './screen_config';
import main_state from './main_state';
import { guiURL } from '@common/constants';

startServer();

export const buildDir = path.join(__dirname, '..');

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
    //will this still work with build?
    window.loadURL(guiURL);
    // window.loadURL(`file://${buildDir}/gui.html`);
    main_state.mainWindow = window;

    //really slow to quit when devtools is up?
    //fairly slow anyway. hiding the window makes it feel responsive...
    //hopefully not hiding some other problem from ourselves.
    window.on('close', ()=>{console.log("quitting"); window.hide(); app.quit()});
}


app.on("ready", async () => {
    //https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
    createGUIWindow();
});