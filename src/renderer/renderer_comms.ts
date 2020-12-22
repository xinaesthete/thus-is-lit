/**
 * (is this the right spec?)
 * 
 * The server has a websocket to connect to.  It will take care of deciding which clients to notify of
 * a given event.
 * 
 * If the renderer reloads (because of code recompilation), we should have a clear way of dealing with that.
 * 
 * The server is probably best-placed to decide which port should be used, 
 * and provide this in the initial URL string, such that when we reload no additional logic is required 
 * to keep it on the same port.
 * 
 * We could probably also add support for renderers started without this config (in web browser rather than
 * launched by Electron) to register themselves, but for now we consider them 'detatched',
 * without ports to the outside world etc.
 * 
 */

import { rendererStarted, host_port, websocketURL, httpURL } from "../common/constants";
import KaleidModel from "../common/KaleidModel";
import { makeRegisterRendererMessage, OscCommandType } from "../common/socket_cmds";
import { Numeric, Tweakable } from "../common/tweakables";

import { paramState } from './params'
import { getVideoURL, setVideoURL, vidEl } from "./video_state";

let socket = new WebSocket(websocketURL);

async function setupWebSocket(model: KaleidModel) {
    //send a message so that our socket is associated with our ID on server.
    //for now we know that the socket won't be open yet, but this is wrong place.
    socket.onopen = () => {
        console.log(`sending WS message to establish this renderer as receiver for id '${model.id}'`);
        // thinking about not using OSC for now: seem to be having trouble finding a library that just works
        socket.send(makeRegisterRendererMessage(model.id));
    }
}

const params = new URLSearchParams(location.search);
//nb, remembering that if we have more than one model in a JS context, we need to revise this scope.
const id = params.has("id") ? Number.parseInt(params.get("id")) : -1;

export async function init(specs: Tweakable<Numeric>[]) {

    //send a message to the server so that it knows what GUI to show...
    //only if we have an id to use from query string.
    //If not, we should still be able to operate as a standalone webpage,
    //but this scenario is not currently being tested.
    const params = new URLSearchParams(location.search);
    if (params.has("id")) {
        //const id = Number.parseInt(params.get("id"));
        const model: KaleidModel = {
            id: id,
            filename: getVideoURL(),
            tweakables: specs,
        }
    
        const body = JSON.stringify(model);
        console.log(`sending ${rendererStarted} ${body}`);
        fetch(`${httpURL}${rendererStarted}`, {
            method: "POST", body: body,
            headers: {"Content-Type": "application/json"}
        });
        //also we need to be able to listen to tweakables tweaking
        //as well as filename and whatever else.
        await setupWebSocket(model);
        //if we're (re)loading a particular model ID, it would be nice to get the old state back ASAP.
        //that's up to the server once the connection is registered.
    }
}

socket.onclose = (ev) => {
    console.log(`socket closed`);
}
const onMsgs: Map<string, (msg:any) => void> = new Map();
socket.onmessage = (ev) => {
    //How shall we specify our message schema?
    //and model in general?
    //very roughly, for now....
    const json = JSON.parse(ev.data as string);
    if (json.address === OscCommandType.Set) {
        const model = json.model as KaleidModel;
        paramState.setValues(model.tweakables);
        setVideoURL(model.filename);
        //vidEl.currentTime// server should understand "Accept-Ranges": "bytes"
        //but if I want to add jumping to cue points then I don't want to set that with every update
        //need to be more careful about what I'm setting.
        //// adding a 'time' that will only be there when restoring state
        if (json.time) vidEl.currentTime = json.time;
    }
    if (onMsgs.has(json.address)) {
        onMsgs.get(json.address)(json);
    }
}

export const onMessage = (key: string, callback: (msg: any) => void) => {
    onMsgs.set(key, callback);
}

export const reportTime = (t: number) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({address: OscCommandType.ReportTime, time: vidEl.currentTime, id: id}));
};