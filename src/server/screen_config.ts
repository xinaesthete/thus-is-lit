import {app, screen, BrowserWindow} from 'electron'
import express from 'express'
import * as os from 'os'
import { buildDir } from '.';
import KaleidModel from '../common/KaleidModel';
import * as consts from '../common/constants'
import { currentModels } from './main_state';

let displays: Electron.Display[];

app.on('ready', () => {
    displays = screen.getAllDisplays();
    //at some point we may do something more with these listeners.
    screen.addListener('display-added', (event, newDisplay) => {
        displays = screen.getAllDisplays();
    })
    
    screen.addListener('display-removed', (event, removedDisplay) => {
        displays = screen.getAllDisplays();
    })
    
    screen.addListener('display-metrics-changed', (event, display) => {
    
    })
});


let i = 0;
export function getNextScreen() {
    //For some reason I think calling screen.getAllDisplays() felt like it may have been a bit slow
    //likely mis-diagnosis.
    return displays[i++ % displays.length];
}

export function useFullscreen() {
    return os.platform() !== 'win32';
}

//moved from server_comms.
//it may still be cleaner to have some of the housekeeping of open renderers etc in another module.
type RendererInitCompletionHandler = (v: KaleidModel)=>void;
const pendingRenderInits = new Map<number, RendererInitCompletionHandler>();
let nextRendererID = 0;

export function addRestAPI(expApp: express.Application) {
    expApp.get(consts.newRenderer, async (req, res) => {
        console.log("[GET] newRenderer request received");
        let id = nextRendererID++;
        //wait for the renderer to send us info back... respond with KaleidModel.
        const m = await createRendererWindow(id);
        
        //I could pass info about what WS port to connect to & what parameters to control here.
        //yes, let's.
        res.send(m);
        // res.send({body: m, CORS: "Access-Control-Allow-Origin: *"});
    });
    
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
            console.log(`/rendererStarted ${id} was not pending init - reloaded?`);
        } else {
            pendingRenderInits.get(id)(info);
            pendingRenderInits.delete(id);
        }
        // const id = Number.parseInt(req.params['id']);
        // const tweakables = JSON.parse(req.params['tweakables']);
        //https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
        //this was relevant when loading page served by liveServer in watch script in web browser...
        //but we probably want to serve from here instead, and certainly don't want to get too wild with which requests we serve.
        res.send();//{CORS: "Access-Control-Allow-Origin: *"}); //XXXXXXXXX JUST TESTING WITH WILDCARD XXXXXXXXXXXXXXXX
    });
}

export async function createRendererWindow(id: number) {
    //TODO: configure based on saved setup etc.
    //relay info about available screens back to gui.
    const screen = getNextScreen();
    const fullscreen = useFullscreen();
    console.log(`creating renderer, fullscreen: ${fullscreen}, screen: ${JSON.stringify(screen)}`);
    const { x, y, width, height } = screen.bounds;

    const window = new BrowserWindow({
        autoHideMenuBar: true,
        //there seems to be a bug in electron when we have multiple fullscreen videos playing
        //(and not being seen directly, but rather fed in to THREE.VideoTexture)
        //using frame: false appears to work better.  I should have an argument for that.
        fullscreen: fullscreen,
        frame: !fullscreen,
        x: x, y: y, width: width, height: height,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    
    //establish communication link here.
    //renderer will be responsible for sending us a '/rendererStarted' request with its id, along with details of Uniforms...
    //refer to psychogeo workerPool backlog promise implementation.
    if (pendingRenderInits.has(id)) throw new Error(`tried to add duplicated id '${id}' to pendingRenderInits`);
    const promise = new Promise<KaleidModel>((resolve, reject) => {
        console.log(`setting pendingRenderInits '${id}'...`);
        pendingRenderInits.set(id, (v: KaleidModel) => {
            console.log(`resolving '${id}'... sending model as response to gui`);
            currentModels.set(id, v); //remember to remove as well.
            //consider lifecycle / what we actually use this for...
            resolve(v);
        })
    });


    //would be good to have a saved configuration 
    //and use that to create sets of windows each on correct screens.
    //nb may go back to old organic-art method of making one big borderless window
    //spanning entire extended desktop
    await window.loadURL(`file://${buildDir}/renderer.html?id=${id}`);
    
    
    return promise;
}
