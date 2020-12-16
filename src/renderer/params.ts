import * as dat from "dat.gui"
import * as THREE from 'three'
import {isNum, isVec2, MovementType, Numeric, Tweakable, Uniforms} from '../common/tweakables'
import {rendererStarted, port} from '../common/constants'
import KaleidModel from '../common/KaleidModel'

function lerp(s, t, a) {
    if (a<0) return s;
    if (a>1) return t;
    return s + a*(t-s);
}

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

function getLagger(v: Numeric, lagTime: number): Lagger<Numeric> {
    if (isNum(v)) {
        return new LagNum(v, lagTime);
    }
    if (isVec2(v)) {
        return new LagVec2(v, lagTime);
    }
}


const gui = new dat.GUI();
//this gui should either not exist on renderer, or be hidden by default...
gui.hide();
let guiHidden = true;
document.onkeypress = (ev) => {
    if (ev.key === "/") {
        if (guiHidden) gui.show();
        else gui.hide();
        guiHidden = !guiHidden;
    }
}
/** 
 * Originally a small helper function, this is now serving as the key function to initialize
 * parameters, register with server/gui etc... indeed if it wasn't called, the emerging protocol
 * for what a Renderer needs to do as a bare minimum would not be met.
 */
export const makeGUI = (specs: Tweakable<Numeric>[], uniforms:Uniforms = {}) => {
    specs.forEach(s => s.movement = MovementType.Modulatable);
    Object.keys(uniforms).forEach(k => uniforms[k].movement = MovementType.Fixed);
    const parms = new ParamGroup(specs, uniforms);
    //send a message to the server so that it knows what GUI to show...
    //only if we have an id to use from query string.
    //If not, we should still be able to operate as a standalone webpage,
    //but this scenario is not currently being tested.
    const params = new URLSearchParams(location.search);
    if (params.has("id")) {
        const id = Number.parseInt(params.get("id"));
        //we don't want all of the uniforms, just the non-Fixed ones?
        //or just flag the ones that are Fixed & ignore them later?
        //... if I just make KaleidModel.tweakables be an array, I can use specs here.
        const model: KaleidModel = {
            id: id,
            filename: "todo",
            tweakables: specs,
        }
        const body = JSON.stringify(model);
        console.log(`sending ${rendererStarted} ${body}`);
        fetch(`http://localhost:${port}${rendererStarted}`, {
            method: "POST", body: body,
            //https://stackoverflow.com/questions/52684372/fetch-post-request-to-express-js-generates-empty-body
            //prefer to keep application/json
            headers: {"Content-Type": "application/json"}
        });
    }
    
    //also we need to be able to listen to tweakables tweaking
    //as well as filename and whatever else.
    //... let's have a WebSocket server here for that.
    return parms;
}



export class ParamGroup {
    parms: ShaderParam[] = [];
    lagTime: number = 1000;
    constructor(specs: Tweakable<Numeric>[], uniforms:Uniforms = {}) {
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
