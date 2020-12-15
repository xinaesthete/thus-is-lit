import * as dat from "dat.gui"
import * as THREE from 'three'

function lerp(s, t, a) {
    if (a<0) return s;
    if (a>1) return t;
    return s + a*(t-s);
}

//implement other types when needed (less to refactor while figuring out design)
type Numeric = number | THREE.Vector2; // | THREE.Vector3 | THREE.Vector4;
interface Lagger<T extends Numeric> {
    lagTime: number;
    update(dt: number) : T;
}
class LagNum implements Lagger<number> {
    lagTime: number;
    curVal: number;
    targVal: number;
    constructor(val: number, lagTime: number) {
        this.curVal = this.targVal = val;
        this.lagTime = lagTime;
    }
    update(dt: number) {
        if (dt <= 0) return this.curVal;
        const a = 1. - Math.pow(0.0001, dt/this.lagTime);
        return this.curVal = lerp(this.curVal, this.targVal, a);
    }
}
class LagVec2 implements Lagger<THREE.Vector2> {
    controlVec: THREE.Vector2;
    outputVec: THREE.Vector2;
    lagX: LagNum;
    lagY: LagNum;
    private _lagTime: number;
    constructor(controlVec: THREE.Vector2, lagTime: number) {
        this.controlVec = controlVec;
        this.outputVec = controlVec.clone();
        this.lagX = new LagNum(controlVec.x, lagTime);
        this.lagY = new LagNum(controlVec.y, lagTime);
        this._lagTime = lagTime;
    }
    update(dt: number) {
        this.lagX.targVal = this.controlVec.x;
        this.lagY.targVal = this.controlVec.y;
        this.outputVec.x = this.lagX.update(dt);
        this.outputVec.y = this.lagY.update(dt);
        return this.outputVec;
    }
    public get lagTime() {
        return this._lagTime;
    }
    public set lagTime(t: number) {
        this._lagTime = t;
        this.lagX.lagTime = t;
        this.lagY.lagTime = t;
    }
}
function isNum(v: Numeric) : v is number {
    return typeof v === "number";
}
function isVec2(v: Numeric) : v is THREE.Vector2 {
    return (v as THREE.Vector2) !== null;
}
/// implement when needed, save refactoring...
// function isVec3(v: Numeric) : v is THREE.Vector3 {
//     return (v as THREE.Vector3) !== null;
// }
// function isVec4(v: Numeric) : v is THREE.Vector4 {
//     return (v as THREE.Vector4) !== null;
// }

function getLagger(v: Numeric, lagTime: number): Lagger<Numeric> {
    if (isNum(v)) {
        return new LagNum(v, lagTime);
    }
    if (isVec2(v)) {
        return new LagVec2(v, lagTime);
    }
}



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

const gui = new dat.GUI();
export const makeGUI = (specs: Tweakable<Numeric>[], uniforms:any = {}) => {
    return new ParamGroup(specs, uniforms);
}



export class ParamGroup {
    parms: ShaderParam[] = [];
    lagTime: number = 1000;
    constructor(specs: Tweakable<Numeric>[], uniforms:any = {}) {
        const parms = this.parms;
        gui.add(this, 'lagTime', 0, 20000);
        specs.forEach(s => {
            //uniforms[s.name] = {value: s.value}
            const v = s.value;
            if (v === undefined) return;
            if (typeof v === "number") {
                const p = new ShaderParam(uniforms, s.name, v, s.min, s.max);
                parms.push(p);
                gui.add(p.val, 'targVal', s.min, s.max, s.step).name(s.name);
            } else if (isVec2(v)) {
                //make the initial value v passed to ShaderParam contain the 'target' values
                //to be updated by the GUI, while the actual values passed to uniform will be encapsulated
                const p = new ShaderParam(uniforms, s.name, v, s.min, s.max);
                parms.push(p);
                gui.add(v, 'x', s.min, s.max, s.step).name(s.name + '.x');
                gui.add(v, 'y', s.min, s.max, s.step).name(s.name + '.y');
            }
        });
    }
    update(dt: number) {
        this.parms.forEach(p=>{
            p.val.lagTime = this.lagTime;
            p.update(dt);
        });
    }
}

export class ShaderParam {
    val: Lagger<Numeric>;
    name: string;
    min: number;
    max: number;
    uniforms: any; //the structure of which this is a member
    uniformObj: any; //TODO: type
    constructor(uniforms, name, init: Numeric = 0.5, min= 0, max= 1, lagTime = 10000) {
        this.uniforms = uniforms;
        // if (this.uniforms[name]) this.uniformObj = this.uniforms[name];
        // else 
        this.uniformObj = this.uniforms[name] = { value: init };
        this.name = name;
        this.min = min;
        this.max = max;
        this.val = getLagger(init, lagTime); //new LagNumeric<Numeric>(init, lagTime);
    }
    update(dt: number) {
        this.uniformObj.value = this.val.update(dt);
    }
}
