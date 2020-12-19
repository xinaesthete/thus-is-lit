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

import { rendererStarted, host_port, websocketURL } from "../common/constants";
import KaleidModel from "../common/KaleidModel";
import { makeRegisterRendererMessage, OscCommandType } from "../common/osc_util";
import { Numeric, Tweakable } from "../common/tweakables";

import { paramState } from './params'

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

export async function init(specs: Tweakable<Numeric>[]) {

    //send a message to the server so that it knows what GUI to show...
    //only if we have an id to use from query string.
    //If not, we should still be able to operate as a standalone webpage,
    //but this scenario is not currently being tested.
    const params = new URLSearchParams(location.search);
    if (params.has("id")) {
        const id = Number.parseInt(params.get("id"));
        const model: KaleidModel = {
            id: id,
            filename: "todo",
            tweakables: specs,
        }
    
        const body = JSON.stringify(model);
        console.log(`sending ${rendererStarted} ${body}`);
        fetch(`http://localhost:${host_port}${rendererStarted}`, {
            method: "POST", body: body,
            headers: {"Content-Type": "application/json"}
        });
        //also we need to be able to listen to tweakables tweaking
        //as well as filename and whatever else.
        //... let's have a WebSocket server here for that.
        setupWebSocket(model);
    }
}

socket.onclose = (ev) => {
    console.log(`socket closed`);
}

socket.onmessage = (ev) => {
    //How shall we specify our message schema?
    //and model in general?
    //very roughly, for now....
    const json = JSON.parse(ev.data as string);
    if (json.address === OscCommandType.Set) {
        const model = json.model as KaleidModel;
        paramState.setValues(model.tweakables);
    }
}


