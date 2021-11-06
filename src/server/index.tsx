import 'source-map-support/register' //evanw delivers yet again
import { app, BrowserWindow, shell } from 'electron'
import * as path from 'path'
import {startServer} from './server_comms'
import { getNextScreen, isMac } from './screen_config';
import main_state from './main_state';
import { localGuiURL } from '@common/network_addresses';

app.allowRendererProcessReuse = false;

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
    //change so BrowserWindows are always on localhost (secure context, allow mediaDevices)
    console.log('localGuiURL', localGuiURL);
    window.loadURL(localGuiURL);
    main_state.mainWindow = window;

    //really slow to quit when devtools is up?
    //fairly slow anyway. hiding the window makes it feel responsive...
    //hopefully not hiding some other problem from ourselves.
    window.on('close', ()=>{console.log("quitting"); window.hide(); app.quit()});
}


app.on("ready", async () => {
    //https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
    //change this to use default browser on mac because of video glitch bug.
    createGUIWindow();
    //if (isMac()) 
    setTimeout(()=> {
        shell.openExternal(localGuiURL);
    }, 500);
});