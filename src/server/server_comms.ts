import { BrowserWindow } from 'electron';
import express from 'express'
import bodyParser from 'body-parser'
import * as consts from '../common/constants'
import KaleidModel from '../common/KaleidModel';

export function start() {
    console.log("initialising server_comms...")
}

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

const currentModels = new Map<number, KaleidModel>();

async function createRendererWindow(id) {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        //there seems to be a bug in electron when we have multiple fullscreen videos playing
        //(and not being seen directly, but rather fed in to THREE.VideoTexture)
        //using frame: false appears to work better.  I should have an argument for that.
        //fullscreen: true,
        frame: false,
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
    res.send(`new renderer created with id '${id}'`);
});

//sent by renderer as it initialises
expApp.post(consts.rendererStarted, (req, res) => {
    console.log(`received /rendererStarted`);
    //find & resolve the associated promise so that the corresponding createRendererWindow can finally return.
    //what possible errors should we think about?
    
    //this is failing because we get something like
    //{ "{a: 42}": "" } whereas we want {a: 42}
    //probably need to write our fetch differently, experimenting with something horrible...
    // const info = JSON.parse(Object.keys(req.body)[0]) as KaleidModel;
    const info = req.body as KaleidModel;
    console.log(`id: '${info.id}'`);
    console.log(JSON.stringify(info, null, 2));
    //why is this error not being thrown?
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
    res.send();
});

expApp.listen(consts.port, () => {
    console.log(`express server listening at http://localhost:${consts.port}`);
});

