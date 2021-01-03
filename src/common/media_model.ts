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
    Null, VideoFile, // ImageFile //, Feedback, CameraStream, RtcStream
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

export interface IVideoDescriptor extends ImageFileDescriptor {
    duration: number;
    //seek time, cue points...
    //VideoPlaybackQuality...
}
//not totally clear on this being what I want, particularly with 'extends' below.
export class VideoPlayState {
    @observable muted = true;
    @observable volume = 1;
    constructor(){
        makeObservable(this);
    }
}

export function parseFFProbeVideoDescriptor(url: string, data: any) : IVideoDescriptor {
    if (!data.streams) throw new Error(`no streams`);
    const streams = data.streams as object[];
    const vidStream = streams.find(
        (s: any) => s["codec_type"] === "video"
    ) as any;
    if (!vidStream) throw new Error(`no video stream`);
    const width = vidStream.width;
    const height = vidStream.height;
    const duration = Number.parseFloat(vidStream.duration);
    // this.muted = true;
    // this.volume = 1;
    const result: IVideoDescriptor = {width, height, duration, url, imgType: ImageType.VideoFile} 

    if (vidStream.side_data_list) {
        const rotation = vidStream.side_data_list[0].rotation;
        if (rotation) result.rotation = rotation;
        //now that I understand this, I think I want to change the order of how things are set...
        //generally more of this Descriptor pushed to the renderer...
    }
    return result;
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
