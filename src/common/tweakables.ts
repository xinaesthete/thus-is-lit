import * as THREE from 'three'

//implement other types when needed (less to refactor while figuring out design)
export type Numeric = number | THREE.Vector2; // | THREE.Vector3 | THREE.Vector4;
//ways of moving:
//constant direction (wrap)
//ping-pong
//noise
//smooth oscillation
//shaped oscillation
// see also THREE.KeyframeTrack et al

export interface Tweakable<T extends Numeric> {
    name?: string,
    value: T,
    min?: number,
    max?: number,
    step?: number,
    shapeFn?: (T) => T
}
export type Uniforms = Record<string, Tweakable<any>>;
//no such luck
//function isTweakNum(t: Tweakable<number>) // t.value is number {}



export function isNum(v: Numeric) : v is number {
    return typeof v === "number";
}
export function isVec2(v: Numeric) : v is THREE.Vector2 {
    return (v as THREE.Vector2) !== null;
}
/// implement when needed, save refactoring...
// function isVec3(v: Numeric) : v is THREE.Vector3 {
//     return (v as THREE.Vector3) !== null;
// }
// function isVec4(v: Numeric) : v is THREE.Vector4 {
//     return (v as THREE.Vector4) !== null;
// }
