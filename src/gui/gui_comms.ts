import { io } from 'socket.io-client'
import { httpURL, websocketURL } from '@common/constants'
import KaleidModel, { KaleidContextType } from '@common/KaleidModel';
import { API } from '@common/socket_cmds';
import { FileConfigPrefs } from '@common/media_model';
import KaleidRenderer from '../renderer/kaleid_renderer';
import { ParamValue, Tweakable } from '@common/tweakables';
import { KaleidList } from './kaleid_context';
import { action, computed, makeObservable } from 'mobx';
import mediaLib from './medialib';

//XXX::: NB. currently using somewhat arbitrary mix of REST & socket...
/// --> moving more towards socket.

const ws = io(websocketURL);//new WebSocket(websocketURL);

//at the moment, all of our models are stored in an array
//which is in component KaleidListProvider.
//this is a local copy of that; we assume there will only be one etc.
let kaleidList: KaleidList;
/**
 * Register events received over websocket to effect the state of the given
 * KaleidList.
 * Called once in KaleidListProvider such that emitted events
 * about the state of models will be encorporated into the context
 * of this GUI instance.
 */
export function registerModelEvents(kList: KaleidList) {
    console.log(`registering model events`);
    kaleidList = kList; // keeping this as module state & re-running useEffect
}


/**send a message to the server asking for a renderer to be created.
 * Server broadcasts info about new model when ready (to be picked up elsewhere).
*/
export async function requestNewRenderer(vidUrl?: string) {
    console.log(`requesting newRenderer...`);
    if (!vidUrl) vidUrl = mediaLib.chooseRandom();
    ws.emit(API.RequestNewRenderer, vidUrl);
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


ws.on('connected', () => {
    console.log(`websocket opened`);
    ws.send(API.RegisterController);
});
ws.on(API.FragCode, (msg: any) => {
    KaleidRenderer.fs = msg.code as string;
    console.log(`shader code changed...`);
});

ws.on(API.Set, action((json: {model: KaleidModel}) => {
    const newModel = json.model;
    console.log(`setting model ${newModel.id} from network event`);
    const oldModel = kaleidList.renderModels.find(m => m.model.id === newModel.id);
    if (!oldModel) {
        console.log('appending model to list');
        kaleidList.addNewModel(newModel);
    } else {
        Object.assign(oldModel, newModel);
    }
}));
ws.on(API.SetParm, action((msg: ParamValue<any>)=>{
    const model = kaleidList.renderModels.find(m => m.model.id === msg.modelId);
    if (!model) {
        console.error(`couldn't find model to SetParm ${JSON.stringify(msg)} (${kaleidList.renderModels.length} models)`);
        return;
    }
    //non-optimal, not expected to be significant bottleneck anytime soon.
    //but would be good to design differently.
    const parm = model?.model.tweakables.find(p => p.name === msg.key);
    if (!parm) {
        console.error(`couldn't find parm ${msg.key}`);
        return;
    }
    parm.value = msg.value;
}));
ws.on(API.RendererAdded, (model: KaleidModel) => {
    kaleidList.addNewModel(model);
});
//ws.on(API.ModelList, action())

export function sendModel(model: KaleidModel) {
    console.log(`sendModel #${model.id}`);
    ws.emit(API.Set, {model: model}); //somewhat slow...
}

export function sendParameterValue(parm: Tweakable<any>, modelId: number) {
    const msg: ParamValue<any> = {value: parm.value, modelId: modelId, key: parm.name!};
    ws.emit(API.SetParm, msg);
}
export function sendVideoChange(url: string, modelId: number) {
    ws.emit(API.SetVideoFilename, {url: url, modelId: modelId});
}


/////
///// Connection status
/////

export const ConnectionStatus = makeObservable({
    get websocketConnected() {
        return ws.connected;
    }
}, {
    'websocketConnected': computed
});