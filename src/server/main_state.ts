// this should represent the ground-truth of all state in the application
// not everything relevant to output necessarily (like animating / lagging parameters, video playback position etc)
// but everything to eg recreate state of controllers after a refresh etc.

import KaleidModel from "../common/KaleidModel";

import WebSocket from 'ws' //https://github.com/websockets/ws/issues/1583

// Without being too tied to a particular dependency, this may be a MobX state tree?
// I think MobX is a good idea, not going to dive right in with state-tree, though.

//Application state (here)
//derivations
//reactions
//actions

class LitState {
    //could be possible (maybe useful at a later date) to have more than one renderer of same thing
    //-- broadcasting generative art to the internet (potentially key feature)
    //-- testing native renderer implementations
    //-- installation environment
    currentModels = new Map<number, KaleidModel>();
    //"Kaleid" generally indicates a point about which an abstraction for other kinds of models may at some point be made.
    //kaleidModels: KaleidModel[] = [];

    //in a sense, renderers can be seen as derivations of models...
    //if we wanted to quit the app & restore state later, we'd restore kaleidModels then instantiate renderers derived from them
    //indeed, in the case of the current application, we would just have our main default controller as per usual 
    //(with appropriate derived model info...), a set of renderers as determind by the list of models (including info about which screen...)
    //any other controller (like on an iPad) would be started manually.
    renderers = new Map<number, WebSocket>();
    playbackTimes = new Map<number, number>();
    controllers: WebSocket[] = [];
    constructor() {

    }
}

const main_state = new LitState();

export default main_state;