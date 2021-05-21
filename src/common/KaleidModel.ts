// specification may be rethought later, (more dynamic? stricter? why not both?)
// (in another project I have fairly robust & successful use of TypeScript API to generate 
// interfaces to SuperCollider Synths at runtime and want to extend that to shaders etc)
// but for now we want some kind of a simple agreed interface for what our renderers look like.
// With the current very-static form of Kaleid renderer, could be good to make this a straightforward
// reflection of that (serving also a guide to what generated).

import { observable, makeObservable } from 'mobx'
import { AbstractImageDecriptor, ImageType } from "./media_model";
import { MovementType, Numeric, Tweakable } from "./tweakables";

export default interface KaleidModel {
    /// auxiliary / housekeeping stuff:::
    /** id key may be subject to change eg when we think about how to restore saved state... */
    id: number;
    imageSource: AbstractImageDecriptor;
    tweakables: Tweakable<Numeric>[];
}

class MobxTweakable<T extends Numeric> implements Tweakable<T> {
    constructor(init: Tweakable<T>, modelId: number) {
        Object.assign(this, init);
        this.value = init.value;
        this.modelId = modelId;
        makeObservable(this, {value: observable});
    }
    name?: string;
    value: T;
    min?: number;
    max?: number;
    step?: number;
    delta?: number;
    movement?: MovementType;
    modelId: number;
}


//reaction / action : send model updates...
export class ObservableKaleidModel implements KaleidModel {
    id: number = -1;
    imageSource: AbstractImageDecriptor;
    tweakables: MobxTweakable<Numeric>[];
    constructor(init: KaleidModel) {
        this.imageSource = { width: -1, height: -1, imgType: ImageType.Null };
        Object.assign(this, init);
        this.tweakables = init.tweakables.map(t => new MobxTweakable(t, init.id)); //losing connection? (see paramsHack...)
        //"Only plain object, array, Map, Set, function, generator function are convertible. Class instances and others are untouched."
        makeObservable(this, {
            imageSource: observable,
            // tweakables: observable,
        });
        // //for now...
        // reaction(
        //     ()=>{
        //         return this.imageSource
        //     }, () => {
        //         sendModel(this);
        //     },
        // )
    }
}

