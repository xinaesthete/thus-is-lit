/**
 * finding an osc library that will sensibly load as a module working both in browser & node/electron
 * without any peculiar build requirements (although maybe there are other reasons for electron-rebuild
 * being useful if there are other native libraries of use)
 * preferably with TS types and without being horribly inefficient etc etc...
 * seems not to be working out for me today.
 * 
 * In my other JS work where I've used OSC heavily, I've used different libraries in client & server,
 * patched around bits for extra efficiency, used <script> instead of import etc...
 * 
 * For now, if everything is in JS land anyway, I don't have much need for OSC.  I may as well use JSON...
 * which is more idiomatic and doesn't require any extra library.  So maybe this file is poorly named.
 * The idea of it is (approximately) to provide an abstraction for encoding & decoding messages where OSC
 * is an internal implementation detail.  So who cares.
 * Later for integration with SuperCollider etc... is a different story, but totally irrelevant for now.
 */
//import * as osc from 'osc-min'
//import * as osc from '@supercollider/osc'
//import * as osc from 'osc'
import KaleidModel from './KaleidModel';

//How shall we specify our message schema?
//It should definitely have "id" for routing.
//structured address vs SuperCollider-style command name & alternating name / value array?
//{address: `/${id}/set/tweakables/${name}`, args: [value]} //difficult to update many simultaneously
//{address: '/set', args: [id, `tweakables/${name}`, value, `tweakables/${name2}`, value2]}
//// going with scsynth-ish style (may be nice to also support other for user-friendliness)

//trying to establish a common place this stuff passes through as well, although...
//we want to hide things like object traversal, but needs of different parts of the system will be different.

//Do I want this? Should it be here on in constants?
export enum OscCommandType {
    Set = "/set", Get = "/get", RegisterRenderer = "/register_renderer", RegisterController = "/register_controller"
}

export interface OscCommand {
    cmd: OscCommandType,

}

// function parseMessage(data: Buffer) {
//     const msg = osc.readPacket(data);

//     // try to conform the message to our spec, and deal with any errors.
//     // *** "as" is not what we want here ***
//     // I keep expecting it to behave like c#

//     const addr = msg.address as OscCommandType;
//     const args = msg.args;
//     const id = args[0] as number;
    
//     const vals: {path: string[], value: any}[] = []
//     for (let i=1; i<args.length; i+=2) {
//         vals.push({path: (args[i] as string).split('/'), value: args[i+1]});
//     }

//     return {addr, vals};
// }

// export function applyMessage(data: Buffer, model: KaleidModel) {
//     const cmd = parseMessage(data);
//     if (cmd.addr === OscCommandType.Set) {
//         cmd.vals.forEach(v => {
//             //just because Three uniforms have all these {value: v} objects everywhere
//             //doesn't mean we have to.
//             //we can have our interface with setters that relate to updating uniforms[name].value if relevant
//             //or doing different things.
//             //////first things first:::: establish the connection.
//         });
//     }
// }


export function makeRegisterRendererMessage(id: number) {
    return JSON.stringify({address: OscCommandType.RegisterRenderer, id: id});
}
export function makeRegisterControllerMessage() {
    return JSON.stringify({address: OscCommandType.RegisterController});
}
