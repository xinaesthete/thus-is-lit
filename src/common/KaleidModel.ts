// specification may be rethought later, (more dynamic? stricter? why not both?)
// (in another project I have fairly robust & successful use of TypeScript API to generate 
// interfaces to SuperCollider Synths at runtime and want to extend that to shaders etc)
// but for now we want some kind of a simple agreed interface for what our renderers look like.
// With the current very-static form of Kaleid renderer, could be good to make this a straightforward
// reflection of that (serving also a guide to what generated).

import { observable, makeObservable, computed, autorun } from 'mobx'
import VideoState from 'renderer/video_state';
import { sendModel } from '../gui/gui_comms';
import { AbstractImageDecriptor, ImageType } from "./media_model";
import { MovementType, Numeric, Tweakable } from "./tweakables";

export default interface KaleidModel {
    /// auxiliary / housekeeping stuff:::
    /** id key may be subject to change eg when we think about how to restore saved state... */
    id: number;
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
}


//reaction / action : send model updates...
export class ObservableKaleidModel implements KaleidModel {
    id: number = -1;
    imageSource: AbstractImageDecriptor;
    tweakables: MobxTweakable<Numeric>[];
    _vidState: VideoState;
    public get vidState() {
        return this._vidState;
    }
    constructor(init: KaleidModel) {
        this.imageSource = {width: -1, height: -1, imgType: ImageType.Null}
        this._vidState = new VideoState();
        Object.assign(this, init);
        this.tweakables = init.tweakables.map(t => new MobxTweakable(t));
        makeObservable(this, {imageSource: observable, tweakables: observable, vidState: computed});
        autorun(() => {
            sendModel(this);
            //sometimes getting an exception here, no setImageState to call...
            //I think this could've been related to immer errors in renderer_control setRenderModels
            //not sure how necessary
            this.vidState.setImageState(this.imageSource);
        });
    }
}

//passing entire KaleidModel as JSON is heavy.
//we don't use anything like this as of this writing, but...
export interface KaleidControlMessage {
    id: number;
    changed: Record<string, Numeric>;
}
