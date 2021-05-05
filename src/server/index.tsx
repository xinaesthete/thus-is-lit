import 'source-map-support/register' //evanw delivers yet again
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import {startServer} from './server_comms'
import { getNextScreen } from './screen_config';
import main_state from './main_state';

///// getAssetURL from electron-snowpack vs our previous 'constants'////
//// we kinda want to use our local IP address
// so that we're on the same origin as remote GUI pages
// don't want to use file:/// even in 'production'
//---> we DO want to use process.env.SNOWPACK_PORT for HMR, though.
//import { getAssetURL } from 'electron-snowpack';
import { guiURL, addr } from '@common/constants';
// import installReactDevtool from './devtool'


export const buildDir = path.join(__dirname, '..');

async function createGUIWindow() {
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
    const ses = window.webContents.session;
    ses.setProxy({
        proxyRules: "http:8123,direct://"//;ws:8123,direct://"
    });
    //really slow to quit when devtools is up?
    //fairly slow anyway. hiding the window makes it feel responsive...
    //hopefully not hiding some other problem from ourselves.
    window.on('close', ()=>{console.log("quitting"); window.hide(); app.quit()});
}


//give main/index.ts something to import.
export default function main() {
    startServer();
    
    app.on("ready", async () => {
        //await installReactDevtool(); //let's try getting at page in browser instead - useful to have that working.
        //https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
        createGUIWindow();
    });
};