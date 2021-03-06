import * as THREE from 'three'
import {isNum, MovementType, Numeric, vec2, Tweakable, Uniforms, ParamValue} from '@common/tweakables'

function lerp(s: number, t: number, a: number) {
    if (a<0) return s;
    if (a>1) return t;
    return s + a*(t-s);
}

interface Lagger<T extends Numeric> {
    lagTime: number;
    update(dt: number) : T;
    targVal: T;
    curVal: T;
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
class LagVec2 implements Lagger<vec2> {
    controlVec: vec2;
    outputVec: vec2;
    lagX: LagNum;
    lagY: LagNum;
    private _lagTime: number;
    constructor(controlVec: vec2, lagTime: number) {
        this.controlVec = controlVec;
        this.outputVec = {...controlVec};
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
    private _targVal = new THREE.Vector2();
    public get targVal() {
        this._targVal.set(this.lagX.targVal, this.lagY.targVal);
        return this._targVal;
    }
    public set targVal(v: THREE.Vector2) {
        //nb, I did already have controlVec
        this._targVal.copy(v);
    }
    public get curVal() {
        return this.outputVec;
    }
}

/** Lagger interface isn't necessarily right for this
 * but there's probably ways this could all be simpler anway.
 */
class AngleRotater implements Lagger<number> {
    lagTime: number;
    targVal: number;
    curVal: number;
    v: Tweakable<number>;
    constructor(v: Tweakable<number>) {
        this.v = v;
        this.lagTime = 0;
        this.targVal = 0;
        this.curVal = 0;
    }
    update(dt: number) {
        // this.curVal = this.curVal + this.v.movementSpeedOffset!*(dt/1000); //like this? or...
        this.curVal = this.curVal + this.targVal*(dt/(10000)); //more this?

        return this.curVal;
    }
}

function getLagger(v: Numeric, lagTime: number): Lagger<Numeric> {
    if (isNum(v)) {
        return new LagNum(v, lagTime);
    }
    //if (isVec2(v)) {
        return new LagVec2(v, lagTime);
    //}
}

function getMotionDriver(v: Tweakable<Numeric>): Lagger<Numeric> {
    if (v.movement === MovementType.AngleShift) {
        return new AngleRotater(v as Tweakable<number>);
    } else {
        return getLagger(v.value, 10000);
    }
}

export let paramState: ParamGroup;

/** 
 * Originally a small helper function, this is now serving as the key function to initialize
 * parameters, register with server/gui etc... indeed if it wasn't called, the emerging protocol
 * for what a Renderer needs to do as a bare minimum would not be met.
 */
export const makeGUI = (specs: Tweakable<Numeric>[], uniforms:Uniforms = {}) => {
    Object.keys(uniforms).forEach(k => uniforms[k].movement = MovementType.Fixed);
    //I don't (yet) use movement parameter, but if I do then I don't want to overwrite specs = Modulatable 
    //// (changing this so it's a less fixed thing)
    specs.forEach(s => {
        if (s.movement === undefined) s.movement = MovementType.Modulatable;
    });
    const parms = new ParamGroup(specs, uniforms);
    paramState = parms;
    return parms;
}


export class ParamGroup {
    parms: ShaderParam[] = [];
    specs: Tweakable<Numeric>[]; //while refactoring comms. Now what?
    lagTime: number = 1000;
    lagParam?: ShaderParam;
    constructor(specs: Tweakable<Numeric>[], uniforms:Uniforms = {}) {
        const parms = this.parms;
        // gui.add(this, 'lagTime', 0, 20000);
        this.specs = specs;//XXX.
        specs.forEach(s => {
            //uniforms[s.name] = {value: s.value}
            const v = s.value;
            if (v === undefined) return;
            if (typeof v === "number") {
                const p = new ShaderParam(uniforms, s);
                parms.push(p);
                if (s.name === 'LagTime') {
                    //Should I make this observable (mobx?)
                    //probably don't need a special case here, but gotta start somewhere
                    //makeObservable(p) //how exactly would I use this? I should think...
                    this.lagParam = p;
                }
            } else { //if (isVec2(v)) {
                //make the initial value v passed to ShaderParam contain the 'target' values
                //to be updated by the GUI, while the actual values passed to uniform will be encapsulated
                //oops... we pass s.movementSpeedOffset by value, so need to be sure it'll make sense when we need it
                ////Really need to sort out this whole ShaderParam / Tweakable / Uniforms nonsense.
                //(seems ok though)
                const p = new ShaderParam(uniforms, s);
                parms.push(p);
            }
        });
    }
    setValues(newValues: Tweakable<Numeric>[]) {
        //console.table(newValues, ['name', 'value']);
        newValues.forEach(t => {
            //so slow and wrong in various ways but probably not enough to matter for a while.
            const p = this.parms.find(p => p.name === t.name);
            if (!p) return;
            if (isNum(t.value)) {
                p.val.targVal = t.value; 
            } else {
                //only numbers and vec2 for now...
                const v = (p.val as LagVec2).controlVec;
                v.x = t.value.x;
                v.y = t.value.y;
                //(p.val.targVal as vec2) = scratchVec2.set(t.value.x, t.value.y);
            }
        });
    }
    setValue(newValue: ParamValue<any>) {
        const t = newValue;
        const k = newValue.key;
        const p = typeof k === 'string' ? this.parms.find(p => p.name === k) : this.parms[k];
        if (!p) return;
        if (newValue.movementSpeedOffset !== undefined) {
            console.log('value set with movementSpeedOffset', newValue.movementSpeedOffset, k);
            p.movementSpeedOffset = newValue.movementSpeedOffset;
        }
        if (isNum(t.value)) {
            p.val.targVal = t.value;
        } else {
            //only numbers and vec2 for now...
            const v = (p.val as LagVec2).controlVec;
            v.x = t.value.x;
            v.y = t.value.y;
        }
    }
    update(dt: number) {
        //hacking in, pending more coherent approach
        if (this.lagParam) {
            const n = this.lagParam.val.targVal as number;
            const hz = 440 * Math.pow(2, (n-69)/12);
            this.lagTime = 1000 / hz;
        }
        this.parms.forEach(p=>{
            ///lag harmony...
            if (p.movementSpeedOffset) {
                p.val.lagTime =  this.lagTime / Math.pow(2, p.movementSpeedOffset/12);
            } else {
                p.val.lagTime = this.lagTime;
            }
            p.update(dt);
        });
    }
}

/**
 * Not entirely clear the role of this vs Tweakable.
 * 
 * 
 * This has reference to overall uniforms object (not used?) as well as 'uniformObj'
 * which is an actual thing to be sent to a shader. Tweakable doesn't necessarily have anything
 * to do with shaders (although at the moment that's the only thing there is).
 * 
 * 
 * This also keeps the motion related state
 */
export class ShaderParam {
    val: Lagger<Numeric>;
    name: string;
    min: number;
    max: number;
    movementSpeedOffset: number;
    uniforms: any; //the structure of which this is a member: ** mutating this should cause graphics to change ***
    uniformObj: any; //TODO: type
    /** Why not just pass the whole Tweakable, and keep a reference to it for good measure? */
    constructor(uniforms: any, spec: Tweakable<Numeric>) {
        const {name='', min=0, max=1, movementSpeedOffset=0, value } = spec;
        this.uniforms = uniforms;
        // if (this.uniforms[name]) this.uniformObj = this.uniforms[name];
        // else 
        this.uniformObj = this.uniforms[name!] = { value: value };
        this.name = name;
        this.min = min;
        this.max = max;
        this.movementSpeedOffset = movementSpeedOffset;
        this.val = getMotionDriver(spec); //new LagNumeric<Numeric>(init, lagTime);
    }
    update(dt: number) {
        this.uniformObj.value = this.val.update(dt);
    }
    setTargVal(v: Numeric) {
        this.val.targVal = v;
    }
}
