// is this the OSC library we are looking for?
// not typed, and docs talk about Electron incompatibility
// I'm not sure I want all of the higher-level features anyway;
// mostly I want something for packing & unpacking efficiently.
// but a well designed API could guide me in a good direction...
// (also @supercolliderjs/osc looks really slow)
import * as osc from 'osc-min'
import { Uniforms } from '../common/tweakables';

//not sure if second arg should be websocket, or some type we have that represents our renderer model...
//(indeed, we could have an object on which we set values causing them to be sent)
export function sendTweakableUpdate(v: Uniforms, target: WebSocket) {
    
}