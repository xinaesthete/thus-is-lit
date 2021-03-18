// is this the OSC library we are looking for?
// not typed, and docs talk about Electron incompatibility
// I'm not sure I want all of the higher-level features anyway;
// mostly I want something for packing & unpacking efficiently.
// but a well designed API could guide me in a good direction...
// (also @supercolliderjs/osc looks really slow)
//import * as osc from 'osc-min'
import { Uniforms } from '../common/tweakables';

import { httpURL, newRenderer, websocketURL } from '../common/constants'
import KaleidModel, { ObservableKaleidModel } from '../common/KaleidModel';
import { makeRegisterControllerMessage, OscCommandType } from '../common/socket_cmds';
import { FileConfigPrefs } from '../common/media_model';
// let's make a button that creates a renderer...
// and then very soon refactor this code somewhere sensible.

/**send a message to the server asking for a renderer to be created.
 * Server responds with a model when ready.
*/
export async function requestNewRenderer() {
    //who should be responsible for keeping track of which renderers are around, associated with with GUI?
    //*probably really needs to be the server* that is the only way that we can ensure integrity.
    console.log(`requesting newRenderer...`);
    const response = await fetch(`${httpURL}${newRenderer}`, {
        //mode: 'cors', headers: {'Access-Control-Allow-Origin' : '*'}
    });
    const info = await response.json() as KaleidModel;
    console.log(`newRenderer response received`);
    return new ObservableKaleidModel(info);
}

export async function requestFileConfigPrefs() {
    console.log('requesting file config');
    const response = await fetch(`${httpURL}/getConfigPrefs`);
    const config = await response.json() as FileConfigPrefs;
    console.log(`file config response: ${JSON.stringify(config)}`);
    return config as FileConfigPrefs;
}

export async function requestFileDialog() {
    console.log('requesting file dialog');
    const response = await fetch(`${httpURL}/openFileDialog`);
    if (response.ok) {
        const path = await response.text();
        return path;
    } else {
        return;
    }
}

export async function requestSetMainAssetPath(path: string) {
    console.log(`requesting to set main asset path to '${path}'`);
    const result = await fetch(`${httpURL}/setMainAssetPath`, {
        method: "POST", body: path,
        headers: {"Content-Type": "text/plain; charset=UTF-8"}
    });
    console.log(`result of setting main asset path '${path}' ${result.ok}`);
    if (!result.ok) console.log(await result.text());
    return result.ok;
}

export async function requestVideoList() {
    console.log('requesting list of videos');
    const result = await fetch(`${httpURL}/videoList`);
    const json = await result.json();
    // console.log(JSON.stringify(json));
    return json;
}
export async function requestImageList() {
    console.log('requesting list of images');
    const result = await fetch(`${httpURL}/imageList`);
    const json = await result.json();
    console.log(JSON.stringify(json));
    return json;
}


export async function requestModelList() {
    const result = await fetch(`${httpURL}/modelList`);
    const info = await result.json() as KaleidModel[];
    return info.map(m => new ObservableKaleidModel(m));
}

//Establish a WebSocket connection to server 
//so that it can notify us about things like new renderers.
//although, as long as there's only one GUI and it requested the renderer itself
//it could use the response to establish connection.

//Many WebSockets vs OSC style routing - hmmm... 
console.log(`making websocket`);
const ws = new WebSocket(websocketURL);
ws.onopen = ev => {
    console.log(`websocket opened`);
    ws.send(makeRegisterControllerMessage());
}
ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    const cmd = msg.address as OscCommandType;
    switch (cmd) {
        case OscCommandType.ModelList:
            //I'm still not quite sure where I push my model here :/
            //almost seems easiest to pull with GET request for now.
            //but I really need a more coherent model before I create a monster.
            break;
        default:
            break;
    }
}

export function sendModel(model: KaleidModel) {
    const msg = JSON.stringify({model: model, address: OscCommandType.Set});
    ws.send(msg);
}
