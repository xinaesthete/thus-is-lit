import { io } from 'socket.io-client'
import { httpURL, newRenderer, websocketURL } from '@common/constants'
import KaleidModel, { KaleidContextType } from '@common/KaleidModel';
import { makeRegisterControllerMessage, OscCommandType } from '@common/socket_cmds';
import { FileConfigPrefs } from '@common/media_model';
import KaleidRenderer from 'renderer/kaleid_renderer';

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
    return new KaleidContextType(info);
}

export async function requestFileConfigPrefs() {
    console.log('requesting file config');
    const response = await fetch(`${httpURL}/getConfigPrefs`);
    const config = await response.json() as FileConfigPrefs;
    console.log(`file config response: ${JSON.stringify(config)}`);
    return config as FileConfigPrefs;
}

export async function requestFileDialog() {
    console.log('requesting file dialog'); //sometimes long delay / lost message...
    const response = await fetch(`${httpURL}/openFileDialog`);
    if (response.ok) {
        const path = await response.text();
        console.log(`path returned from requestFileDialog(): '${path}'`);
        //why was I subsequently passing an empty string around sometimes?
        //had trouble reproducing. **Would be nice to have tests in place.**
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
    return info.map(m => new KaleidContextType(m));
}

//Establish a WebSocket connection to server 
//so that it can notify us about things like new renderers.
//although, as long as there's only one GUI and it requested the renderer itself
//it could use the response to establish connection.

//switching to socket.io implementation
const ws = io();//new WebSocket(websocketURL);

ws.on('connected', () => {
    console.log(`websocket opened`);
    ws.send(makeRegisterControllerMessage());
});
ws.on(OscCommandType.FragCode, (msg: any) => {
    KaleidRenderer.fs = msg.code as string;
    console.log(`shader code changed...`);
});

export function sendModel(model: KaleidModel) {
    ws.send(OscCommandType.Set, model);
}
