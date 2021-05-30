import {app, screen, BrowserWindow} from 'electron'
import express from 'express'
import * as os from 'os'
import KaleidModel from '@common/KaleidModel';
import * as consts from '@common/network_addresses'
import main_state from './main_state';
import { API } from '@common/socket_cmds';

let displays: Electron.Display[];

app.on('ready', () => {
    displays = screen.getAllDisplays();
    console.log(JSON.stringify(displays, null, 2));
    //at some point we may do something more with these listeners.
    //(sending info to gui...)
    screen.addListener('display-added', (event, newDisplay) => {
        displays = screen.getAllDisplays();
        console.log('display added', newDisplay.id, JSON.stringify(newDisplay.bounds, null, 2));
    });
    
    screen.addListener('display-removed', (event, removedDisplay) => {
        displays = screen.getAllDisplays();
        console.log('display removed', removedDisplay.id, JSON.stringify(removedDisplay.bounds, null, 2));
    });
    
    screen.addListener('display-metrics-changed', (event, display) => {
        console.log('display metrics changed', display.id, JSON.stringify(display.bounds, null, 2));
    });
});

/// --- for now I'm bypassing anything to do with automatic screen assignment
//      could be handled by the gui at some point.
let i = 0;
export function getNextScreen() {
    //For some reason I think calling screen.getAllDisplays() felt like it may have been a bit slow
    //likely mis-diagnosis.
    return displays[0];//[i++ % displays.length];
}
/** quick hack to position new renderer windows */
function getNextBounds() {
    const screen = getNextScreen();
    const col = i % 2;
    const row = Math.floor((i%4 / 2));
    console.log(`row: ${row}, col: ${col}`);
    i++;
    const { x, y, width, height } = screen.bounds;
    const aspect = 16/9;
    const w = width/2;
    return {x: x+col*width/2, y: y+row*height/2, width: w, height: w/aspect};
}
function getPresentationScreen() {
    if (displays.length < 2) return getNextBounds();
    const fullscreen = true;
    return {fullscreen, ...displays[1].bounds};
}
export function isWindows() {
    return os.platform() === 'win32';
}
export function isMac() {
    return os.platform() === 'darwin';
}
// ----

//moved from server_comms.
//it may still be cleaner to have some of the housekeeping of open renderers etc in another module.
type RendererInitCompletionHandler = (v: KaleidModel)=>void;
const pendingRenderInits = new Map<number, RendererInitCompletionHandler>();
let nextRendererID = 1;

export function addRestAPI(expApp: express.Application) {
    //sent by renderer as it initialises
    expApp.post(consts.rendererStarted, (req, res) => {
        console.log(`[POST] received /rendererStarted`);
        //find & resolve the associated promise so that the corresponding createRendererWindow can finally return.
        //what possible errors should we think about?
        
        const info = req.body as KaleidModel;
        console.log(`id: '${info.id}'`);
        // console.log(JSON.stringify(info, null, 2));
        //why was this error not being thrown?
        if (!info) throw new Error(`/rendererStarted body '${req.body}' couldn't be parsed as KaleidModel.`)
        const id = info.id;
        if (!pendingRenderInits.has(id)) {
            //this is not an error, it's a pending feature...
            //we should then have a record of what existing gui was associated, 
            //and then be able to get it to send the same values back and get back to similar state...
            //EDIT: NOT NECESSARILY... what if I want to be able to make a renderer on another device 
            //by just opening a browser window with manual ID... perhaps change that to have different logic
            console.log(`/rendererStarted ${id} was not pending init - reloaded?`);
        } else {
            pendingRenderInits.get(id)!(info);
            pendingRenderInits.delete(id);
        }
        res.send();
    });
    expApp.get(API.RequestNewRenderer, (req, res) => {
        // serve ... with additional args...
        const id = nextRendererID++;
        //const vidUrl = TBD;
        establishRenderComms(id).then(()=>{
            console.log(`GET renderer ${id} comms established`);
        });
        const url = consts.remoteRendererURL + `?id=${id}`
        console.log(`GET ${API.RequestNewRenderer} redirecting to '${url}'`);
        res.redirect(url);
    });
}

const renderWindows = new Map<number, BrowserWindow>();//not necessarily proper way of mapping
export function toggleRendererFullscreen(id: number) {
    console.log('makeRendererFullscreen', id);
    const win = renderWindows.get(id);
    if (!win) return;
    const display = screen.getDisplayMatching(win.getBounds());
    win.setSimpleFullScreen(!win.simpleFullScreen);
}
export async function createRendererWindow(vidUrl?: string, presentation?: boolean) {
    const id = nextRendererID++;
    //TODO: configure based on saved setup etc.
    //relay info about available screens back to gui.
    // const screen = getNextScreen(); //TODO: review auto screen-assignment
    // const frame = !isWindows();
    const bounds = presentation ? getPresentationScreen() : getNextBounds();
    console.log(`creating renderer, bounds: ${JSON.stringify(bounds)}`);

    const window = new BrowserWindow({
        autoHideMenuBar: true,
        //there seems to be a bug in electron when we have multiple fullscreen videos playing
        //(and not being seen directly, but rather fed in to THREE.VideoTexture)
        //using frame: false appears to work better.  I should have an argument for that.
        // fullscreen: fullscreen,
        // frame: frame,
        // x: x+width/4, y: y+width/4, width: width/2, height: height/2,
        ...bounds,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    //let's keep track of windows, load/save... not too much boilerplate preferably.
    renderWindows.set(id, window);
    
    //establish communication link here.
    //renderer will be responsible for sending us a '/rendererStarted' request with its id, along with details of Uniforms...
    //refer to psychogeo workerPool backlog promise implementation.
    if (pendingRenderInits.has(id)) throw new Error(`tried to add duplicated id '${id}' to pendingRenderInits`);
    const promise = establishRenderComms(id);

    const vidArg = vidUrl ? '&vidUrl=' + encodeURI(vidUrl) : '';
    await window.loadURL(`${consts.localRendererURL}?id=${id}${vidArg}`);
    
    
    return promise;
}

async function establishRenderComms(id: number) {
    //establish communication link here.
    //renderer will be responsible for sending us a '/rendererStarted' request with its id, along with details of Uniforms...
    //refer to psychogeo workerPool backlog promise implementation.
    if (pendingRenderInits.has(id)) throw new Error(`tried to add duplicated id '${id}' to pendingRenderInits`);
    return new Promise<KaleidModel>((resolve, reject) => {
        console.log(`setting pendingRenderInits '${id}'...`);
        pendingRenderInits.set(id, (v: KaleidModel) => {
            console.log(`resolving '${id}'... sending model as response to gui`);
            main_state.currentModels.set(id, v); //remember to remove as well.
            //consider lifecycle / what we actually use this for...
            resolve(v);
        })
    });
}