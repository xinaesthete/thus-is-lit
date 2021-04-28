import { action, makeObservable, observable } from "mobx";

/** this will have different implementations in GUI and Server for controlling persistence etc */
export interface FileConfigPrefs {
    mainAssetPath?: string;
    //associate names with locations?
    //not adding fancy features that I won't be testing yet.
    //but I'd like to be able to make a request to "TITK/someFile" 
    //and it should look up someFile in the TITK configured on that machine.
    //but then again if we seriously get in to asset management then we probably want an sqlite db
    //or whatever... but anyway, not today.
    //contentLibs?: Record<string, string>; 
    version: string; //no clear spec for reasoning about this yet...
}

export enum ImageType {
    Null, VideoFile, FeedBack, ImageFile //, CameraStream, RtcStream
}
export type ImRot = 0 | 90 | -90 | 180;
export interface AbstractImageDecriptor {
    width: number; //derived rather than computed, and often not known when making one of these
    height: number;
    imgType: ImageType; //seems logical for this to be generic type,
    rotation?: ImRot;
    //but I need to figure out how to usefully use that at runtime.
    //also consider how to differentiate 360s / associated fisheye pairs...???
    //projection: 'plane' | 'equirectangular' | 'fisheye' ?? 'fisheyeA' | 'fisheyeB' ?
}

export interface ImageFileDescriptor extends AbstractImageDecriptor {
    url: string;
}
export interface FeedbackDescriptor extends AbstractImageDecriptor {}

export interface IVideoDescriptor extends ImageFileDescriptor {
    duration: number;
    //seek time, cue points...
    //VideoPlaybackQuality...
}
//not totally clear on this being what I want, particularly with 'extends' below.
export class VideoPlayState {
    muted = true;
    paused = false;
    volume = 1;
    constructor(){
        makeObservable(this, {
            muted: observable, paused: observable, volume: observable
        });
    }
}

export class VideoDescriptor extends VideoPlayState implements IVideoDescriptor {
    // muted: boolean;
    // volume: number;
    duration: number = 0;
    url: string;
    width: number = -1;
    height: number = -1;
    imgType: ImageType = ImageType.VideoFile;
    rotation?: ImRot;
    constructor(url: string, data?: IVideoDescriptor) {
        super();
        this.url = url;
        Object.assign(this, data);
    }
}

//for future implementation: not exported until implemented.
interface ImageFeedbackState extends AbstractImageDecriptor {}
interface CameraStreamState extends AbstractImageDecriptor {}
interface WebRTCStreamState extends AbstractImageDecriptor {}
