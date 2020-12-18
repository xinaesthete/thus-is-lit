// specification may be rethought later, (more dynamic? stricter? why not both?)
// (in another project I have fairly robust & successful use of TypeScript API to generate 
// interfaces to SuperCollider Synths at runtime and want to extend that to shaders etc)
// but for now we want some kind of a simple agreed interface for what our renderers look like.
// With the current very-static form of Kaleid renderer, could be good to make this a straightforward
// reflection of that (serving also a guide to what generated).


import { Tweakable } from "./tweakables";

export default interface KaleidModel {
    /// auxiliary / housekeeping stuff:::
    /** id key may be subject to change eg when we think about how to restore saved state... */
    id: number,

    /// stuff that effects the content:::
    filename: string,
    tweakables: Tweakable<any>[]
}

