// specification may be rethought later, (more dynamic? stricter? why not both?)
// (in another project I have fairly robust & successful use of TypeScript API to generate 
// interfaces to SuperCollider Synths at runtime and want to extend that to shaders etc)
// but for now we want some kind of a simple agreed interface for what our renderers look like.
// With the current very-static form of Kaleid renderer, could be good to make this a straightforward
// reflection of that (serving also a guide to what generated).

import { sendModel, sendVideoState } from '@gui/gui_comms';
import { observable, makeObservable, autorun, action } from 'mobx'
import { AbstractImageDecriptor, ImageType, VideoDescriptor } from "./media_model";
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
        const movement = init.movementSpeedOffset !== undefined;
        if (movement) {
            makeObservable(this, {value: observable, movementSpeedOffset: movement});
        } else {
            makeObservable(this, {value: observable});
        }
    }
    name?: string;
    value: T;
    min?: number;
    max?: number;
    default?: T;
    step?: number;
    delta?: number;
    tags?: string[];
    movement?: MovementType;
    movementSpeedOffset?: number;
    modelId: number;
    specialWidget?: boolean;
}


//reaction / action : send model updates...
export class ObservableKaleidModel implements KaleidModel {
    id: number = -1;
    imageSource: AbstractImageDecriptor;
    tweakables: MobxTweakable<Numeric>[];
    constructor(init: KaleidModel) {
        this.imageSource = { width: -1, height: -1, imgType: ImageType.Null }; //will be changed by Object.assign.
        Object.assign(this, init);
        this.tweakables = init.tweakables.map(t => new MobxTweakable(t, init.id)); //losing connection? (see paramsHack...)
        //"Only plain object, array, Map, Set, function, generator function are convertible. Class instances and others are untouched."
        makeObservable(this, {
            imageSource: observable,
            // tweakables: observable,
        }, {deep: true});
        autorun(() => {
            // console.log('autorun KaleidModel, sending sendVideoState...');
            sendVideoState(this.imageSource as VideoDescriptor, this.id);
        });
    }
    setNeutral() {
        const t = this.tweakables.filter(t=>t.tags && t.tags.includes('main'));
        console.log('setNeutral');
        action(() => {
            t.forEach(t => {
                console.log(`changing ${t.name} from ${t.value} to ${t.default}`);
                t.value = t.default! //assumes number type, not vec2
            });
        })();
        sendModel(this);
    }
}

