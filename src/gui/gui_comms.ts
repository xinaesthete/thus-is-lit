// is this the OSC library we are looking for?
// not typed, and docs talk about Electron incompatibility
// I'm not sure I want all of the higher-level features anyway;
// mostly I want something for packing & unpacking efficiently.
// but a well designed API could guide me in a good direction...
// (also @supercolliderjs/osc looks really slow)
//import * as osc from 'osc-min'
import { Uniforms } from '../common/tweakables';

import { host_port, httpURL, newRenderer, websocketURL } from '../common/constants'
import KaleidModel from '../common/KaleidModel';
import { makeRegisterControllerMessage, OscCommandType } from '../common/osc_util';
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
    return info;
}

export async function requestFileConfigPrefs() {
    console.log('requesting file config');
    const response = await fetch(`${httpURL}/getConfigPrefs`);
    const config = await response.json() as FileConfigPrefs;
    console.log(`file config response: ${JSON.stringify(config)}`);
    return config as FileConfigPrefs;
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
ws.onmessage = ev => console.log(`websocket message`);

export function sendModel(model: KaleidModel) {
    ws.send(JSON.stringify({model: model, address: OscCommandType.Set}));
}