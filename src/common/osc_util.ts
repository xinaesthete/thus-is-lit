//import * as osc from 'osc-min'
import * as osc from '@supercollider/osc'
import KaleidModel from './KaleidModel';

//How shall we specify our message schema?
//It should definitely have "id" for routing.
//structured address vs SuperCollider-style command name & alternating name / value array?
//{address: `/${id}/set/tweakables/${name}`, args: [value]} //difficult to update many simultaneously
//{address: '/set', args: [id, `tweakables/${name}`, value, `tweakables/${name2}`, value2]}
//// going with scsynth-ish style (may be nice to also support other for user-friendliness)

//trying to establish a common place this stuff passes through as well, although...
//we want to hide things like object traversal, but needs of different parts of the system will be different.

export enum OscCommandType {
    Set = "/set", Get = "/get"
}

export interface OscCommand {
    cmd: OscCommandType,

}

function parseMessage(data: Buffer) {
    const msg = osc.unpackMessage(data);

    // try to conform the message to our spec, and deal with any errors.
    // *** "as" is not what we want here ***
    // I keep expecting it to behave like c#

    const addr = msg.address as OscCommandType;
    const args = msg.args;
    const id = args[0] as number;
    
    const vals: {path: string[], value: any}[] = []
    for (let i=1; i<args.length; i+=2) {
        vals.push({path: (args[i] as string).split('/'), value: args[i+1]});
    }

    return {addr, vals};
}

export function applyMessage(data: Buffer, model: KaleidModel) {
    const cmd = parseMessage(data);
    if (cmd.addr === OscCommandType.Set) {
        cmd.vals.forEach(v => {
            //just because Three uniforms have all these {value: v} objects everywhere
            //doesn't mean we have to.
            //we can have our interface with setters that relate to updating uniforms[name].value if relevant
            //or doing different things.
            //////first things first:::: establish the connection.
        });
    }
}
