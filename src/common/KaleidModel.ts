// specification may be rethought later, (more dynamic? stricter? why not both?)
// (in another project I have fairly robust & successful use of TypeScript API to generate 
// interfaces to SuperCollider Synths at runtime and want to extend that to shaders etc)
// but for now we want some kind of a simple agreed interface for what our renderers look like.
// With the current very-static form of Kaleid renderer, could be good to make this a straightforward
// reflection of that (serving also a guide to what generated).

import { observable, makeObservable, action, autorun } from 'mobx'
import { sendModel } from '../gui/gui_comms';
import { AbstractImageDecriptor, ImageType } from "./media_model";
import { MovementType, Numeric, Tweakable } from "./tweakables";

export default interface KaleidModel {
    /// auxiliary / housekeeping stuff:::
    /** id key may be subject to change eg when we think about how to restore saved state... */
    id: number;
    //thinking of having something like this, separate from VideoState etc, for not updating
    //embedded gui previews.
    // paused: boolean; //probably not this name.

    /// stuff that effects the content:::
    //filename: string; //first was this...
    //video: VideoState; //next this...
    //later--- textureSource: VideoState | FeedbackTexture | ... ///observable
    imageSource: AbstractImageDecriptor;
    tweakables: Tweakable<any>[];
}

class MobxTweakable<T extends Numeric> implements Tweakable<T> {
    constructor(init: Tweakable<T>) {
        Object.assign(this, init);
        this.value = init.value;
        makeObservable(this, {value: observable});
    }
    name?: string | undefined;
    value: T;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    delta?: number | undefined;
    movement?: MovementType | undefined;
    //"You can write a action setter for each prop of the above, but it misses the point (and optimizations), 
    //the idea is rather that you mark all the operations your application has as actions."
    // that doesn't mean we need to use setters everywhere (with the irritation that "observable get" & "action set"
    // don't mix)
    // we just need to wrap events as action e.g. (pseudocode) "onChange=action((v) => u.value = v)"
    // no need for "onChange=(v) => u.setValue(v)"
    // @action setValue(v: T) {
    //     this.value = v;
    // }
}


//reaction / action : send model updates...
export class ObservableKaleidModel implements KaleidModel {
    id: number = -1;
    imageSource: AbstractImageDecriptor;
    tweakables: MobxTweakable<any>[];
    constructor(init: KaleidModel) {
        this.imageSource = {width: -1, height: -1, imgType: ImageType.Null}
        Object.assign(this, init);
        this.tweakables = init.tweakables.map(t => new MobxTweakable(t));
        makeObservable(this, {imageSource: observable, tweakables: observable});
        autorun(() => sendModel(this));
    }
}

//passing entire KaleidModel as JSON is heavy.
//we don't use anything like this as of this writing, but...
export interface KaleidControlMessage {
    id: number;

    changed: Record<string, Numeric>;
}
