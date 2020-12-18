// this file is starting to have too many separate areas of concern:
// should be broken up
/// express API
/// fileserver (with hot-reloading of code, config of asset paths etc)
/// websocket comms for control changes...

import { BrowserWindow } from 'electron';
import express from 'express'
import * as ws from 'ws'
import bodyParser from 'body-parser'
import * as consts from '../common/constants'
import KaleidModel from '../common/KaleidModel';
import { getNextScreen, useFullscreen } from './screen_config';


const expApp = express();
//https://stackoverflow.com/questions/52684372/fetch-post-request-to-express-js-generates-empty-body
//trying to figure out whether express.json() is enough, whether we need body-parser
//or why we shouldn't just have a JSON string and parse it ourselves.
//express depends on body-parser already, so it's not adding to node_modules.
//but it does seem to be adding to bundle size, largely because of iconv
//expApp.use(express.json());
expApp.use(bodyParser.urlencoded({extended: false}));
expApp.use(bodyParser.json());

//it may be cleaner to have housekeeping of open renderers etc in another module.
let nextRendererID = 0;
type RendererInitCompletionHandler = (v: KaleidModel)=>void;
const pendingRenderInits = new Map<number, RendererInitCompletionHandler>();

const currentModels = new Map<number, KaleidModel>(); ////

async function createRendererWindow(id) {
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
    await window.loadURL(`file://${__dirname}/renderer.html?id=${id}`);
    
    
    return promise;
}

expApp.get(consts.newRenderer, async (req, res) => {
    console.log("newRenderer request received");
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
    console.log(`received /rendererStarted`);
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


export function start() {
    console.log("initialising server_comms...");
    //this file could be very simple, and call a few modules one by one...
    const server = expApp.listen(consts.host_port, () => {
        console.log(`express server listening at http://localhost:${consts.host_port}`);
    });

    const wsServer = new ws.Server({server: server});
    wsServer.on('connection', socket => {
        console.log(`new ws connection:::`);
        socket.on('message', message => console.log(message));
    });

    // server.on('upgrade', (request, socket, head) => {
    //     wsServer.handleUpgrade((request, socket, head) => {
    //         wsServer.emit('connection', socket, request);
    //     });
    // })
}
