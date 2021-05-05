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

import { rendererStarted, httpURL } from "@common/constants";
import KaleidModel from "@common/KaleidModel";
import { API } from "@common/socket_cmds";
import KaleidRenderer from "./kaleid_renderer";

import { paramState } from './params'
import VideoState from "./video_state";
import { io } from 'socket.io-client'
import { ParamValue } from "@common/tweakables";

let socket = io({port: '8123'});// new WebSocket(websocketURL);

async function setupWebSocket(model: KaleidModel) {
    //send a message so that our socket is associated with our ID on server.
    //for now we know that the socket won't be open yet, but this is wrong place.
    socket.on('connected', () => {
        console.log(`sending WS message to establish this renderer as receiver for id '${model.id}'`);
        socket.send(API.RegisterRenderer, model.id);
    });
}

const params = new URLSearchParams(location.search);
//nb, remembering that if we have more than one model in a JS context, we need to revise this scope.
const id = params.has("id") ? Number.parseInt(params.get("id")!) : -1;
document.title = "this is renderer " + id;
let vidState: VideoState;
export async function init(r: KaleidRenderer) {
    vidState = r.vid; //XXX threact?
    //send a message to the server so that it knows what GUI to show...
    //only if we have an id to use from query string.
    //If not, we should still be able to operate as a standalone webpage,
    //but this scenario is not currently being tested.
    const params = new URLSearchParams(location.search);
    if (params.has("id")) {
        //const id = Number.parseInt(params.get("id"));
        const model: KaleidModel = {
            id: id,
            imageSource: r.vid.imageState,
            tweakables: r.parms.specs,
        };

        const body = JSON.stringify(model);
        console.log(`sending ${rendererStarted} ${body}`);
        fetch(`${httpURL}${rendererStarted}`, {
            method: "POST",
            body: body,
            headers: { "Content-Type": "application/json" },
        });
        //also we need to be able to listen to tweakables tweaking
        //as well as filename and whatever else.
        await setupWebSocket(model);
        //if we're (re)loading a particular model ID, it would be nice to get the old state back ASAP.
        //that's up to the server once the connection is registered.

        onMessage("/fragCode", json => {
            //threact?
            console.log(`shader code changed...`);
            KaleidRenderer.fs = json.code;
        });
        r.onUpdate = reportTime;
    }
}
//shouldn't matter that events are registered before socket is connected.
socket.on('disconnect', (ev) => {
    console.log(`socket closed`);
});

socket.on(API.Set, (msg: {model: KaleidModel, time?: number}) => {
    const model = msg.model;
    if (model.id !== id) return;
    paramState.setValues(model.tweakables);
    //just because we've decided which config we want, doesn't mean it'll be ready straight away
    vidState.setImageState(model.imageSource);
    //vidEl.currentTime// server should understand "Accept-Ranges": "bytes"
    //but if I want to add jumping to cue points then I don't want to set that with every update
    //need to be more careful about what I'm setting.
    //(also would want to be able to pre-cache if I know I might want to seek)
    //// adding a 'time' that will only be there when restoring state
    if (msg.time) vidState.vidEl.currentTime = msg.time;
});

socket.on(API.SetParm, (msg: ParamValue<any>) => {
    if (msg.modelId !== id) return;
    paramState.setValue(msg);
});

socket.on(API.SetVideoFilename, (msg: {url: string, modelId: number}) => {
    if (msg.modelId !== id) return;
    vidState.vidUrl = msg.url;
});

function onMessage(key: string, callback: (msg: any) => void) {
    socket.on(key, callback);
}

function reportTime() {
    if (!vidState) return;
    socket.send(API.ReportTime, {time: vidState.vidEl.currentTime, id: id});
};

function reportError (error: string) {
    socket.send('error', {error: error});
}