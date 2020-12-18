// is this the OSC library we are looking for?
// not typed, and docs talk about Electron incompatibility
// I'm not sure I want all of the higher-level features anyway;
// mostly I want something for packing & unpacking efficiently.
// but a well designed API could guide me in a good direction...
// (also @supercolliderjs/osc looks really slow)
import * as osc from 'osc-min'
import { Uniforms } from '../common/tweakables';


import {port, newRenderer} from '../common/constants'
import KaleidModel from '../common/KaleidModel';
// let's make a button that creates a renderer...
// and then very soon refactor this code somewhere sensible.

/**send a message to the server asking for a renderer to be created.
 * Server responds with a model when ready.
*/
export async function makeLight() {
  //who should be responsible for keeping track of which renderers are around, associated with with GUI?
  //*probably really needs to be the server* that is the only way that we can ensure integrity.
  console.log(`requesting newRenderer...`);
  //TODO: consider server not on localhost.
  const response = await fetch(`http://localhost:${port}${newRenderer}`, {
    //mode: 'cors', headers: {'Access-Control-Allow-Origin' : '*'}
  });
  const info = await response.json() as KaleidModel;
  console.log(`newRenderer response received`);
  return info;
}


//not sure if second arg should be websocket, or some type we have that represents our renderer model...
//(indeed, we could have an object on which we set values causing them to be sent)
export function sendTweakableUpdate(v: Uniforms, target: WebSocket) {
    
}

//at some point we want to establish a WebSocket connection to server 
//so that it can notify us about things like new renderers.
//although, as long as there's only one GUI and it requested the renderer itself
//it could use the response to establish connection.

//Many WebSockets vs OSC style routing - hmmm... 