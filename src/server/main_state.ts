// this should represent the ground-truth of all state in the application
// not everything relevant to output necessarily (like animating / lagging parameters, video playback position etc)
// but everything to eg recreate state of controllers after a refresh etc.

import KaleidModel from "@common/KaleidModel";
import * as file_config from './assets/file_config'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
//import WebSocket from 'ws' //https://github.com/websockets/ws/issues/1583
import { Socket } from 'socket.io'
import {app, BrowserWindow} from 'electron'
import { IVideoDescriptor } from "@common/media_model";
// Without being too tied to a particular dependency, this may be a MobX state tree?
// I think MobX is a good idea, not going to dive right in with state-tree, though.

//Application state (here)
//derivations
//reactions
//actions

// https://mobx.netlify.app/guides/json/ is about dart / flutter... which I may want to look into, but it's not what I want now.


class LitState {
    //"Kaleid" generally indicates a point about which an abstraction for other kinds of models may at some point be made.
    
    //could be possible (maybe useful at a later date) to have more than one renderer of same thing
    //-- embedded in gui (without associated socket, state from controller)
    //-- broadcasting generative art to the internet (potentially key feature)
    //-- "master of puppets":: interactive online thing with phone gyro controllers.
    //-- testing different renderer implementations
    //-- installation environment
    currentModels = new Map<number, KaleidModel>();
    //kaleidModels: KaleidModel[] = [];

    //in a sense, renderers can be seen as derivations of models...
    //if we wanted to quit the app & restore state later, we'd restore kaleidModels then instantiate renderers derived from them
    //indeed, in the case of the current application, we would just have our main default controller as per usual 
    //(with appropriate derived model info...), a set of renderers as determind by the list of models (including info about which screen...)
    //any other controller (like on an iPad) would be started manually.
    renderers = new Map<number, Socket>();
    playbackTimes = new Map<number, number>();
    
    videoMetadataRaw: any[] = []; //for quick debug...
    videoMetadataParsed: IVideoDescriptor[] = [];
    lastError: string = "";
    /// all of above can be Map<id, Model> where Model is responsible for state of an entity
    controllers: Socket[] = [];
    mainWindow?: BrowserWindow;
    constructor() {}
}

const main_state = new LitState();

export default main_state;

export async function getStateAsJsonString() {
    return JSON.stringify(main_state, null, 2); //error: Converting circular structure to JSON.
}

//TODO...
export async function restoreJsonStateFromDisk(filename: string) {
    const text = await fs.promises.readFile(filename, 'utf-8');
    // const modelReviver = (k: string, v: any) => {}
    JSON.parse(text);
}

app.addListener('before-quit', async () => {
    //TODO init tempPath / appDataPath etc
    saveMainStateToDisk(path.join(os.tmpdir(), 'autosave.json'));
})
export async function saveMainStateToDisk(filename: string) {
    console.log(`saving to ${filename}`);
    try {
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) await fs.promises.mkdir(dir);
        const json = await getStateAsJsonString();
        // console.log(json);
        await fs.promises.writeFile(filename, json);
    } catch (e) {
        console.error(`[file_config] error saving main_state to disk: '${e}'`);
    }
    
}
