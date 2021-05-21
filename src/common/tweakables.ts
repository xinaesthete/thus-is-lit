// changes here cause whole GUI to reload, renderer state lost - would be good to fix that.
//implement other types when needed (less to refactor while figuring out design)
export interface vec2 {x: number, y: number};
export type Numeric = number | vec2; // | THREE.Vector3 | THREE.Vector4;
//...value for vec2 passed as {x: number, y: number} needs some adaptation...


//ways of moving:
//fixed value, no gui...
//via slider
//constant direction (wrap)
//ping-pong
//noise
//smooth oscillation
//shaped oscillation
// see also THREE.KeyframeTrack et al

export enum MovementType {
    //consider adding more options as above, for now want a way of conveying that some uniforms
    //are fixed part of system, e.g. only internal to renderer rather than part of model.
    Fixed, Modulatable 
}

//add an optional neutral value to reset to? (eg gain = 0.5)
export interface Tweakable<T extends Numeric> {
    name?: string,
    value: T, //in concrete uses this may be @observable (and set with an @action)
    default?: T,
    min?: number,
    max?: number,
    step?: number,
    delta?: number,
    wrap?: boolean,
    movement?: MovementType,
    tags?: string[],
    specialWidget?: boolean
    //scale?: (T) => T //change to be similar to MuiSlider? but that has a different idea about relation to min&max?
    //also if I want to send functions for eval across wire, I need to be careful about trust... and anyway, I'm not using this yet.
}

/** enough information to transmit slider change */
export interface ParamValue<T> {
    value: T, modelId: number, key: string | number
}

export type Uniforms = Record<string, Tweakable<any>>;
//no such luck
//function isTweakNum(t: Tweakable<number>) // t.value is number {}



export function isNum(v: Numeric) : v is number {
    return typeof v === "number";
}
// export function isVec2(v: Numeric) : v is vec2 {
//     return (v as vec2) !== null; //note that 'as' is not helping us here, but 'is' above should.
// }


/// implement when needed, save refactoring...
// function isVec3(v: Numeric) : v is THREE.Vector3 {
//     return (v as THREE.Vector3) !== null;
// }
// function isVec4(v: Numeric) : v is THREE.Vector4 {
//     return (v as THREE.Vector4) !== null;
// }
