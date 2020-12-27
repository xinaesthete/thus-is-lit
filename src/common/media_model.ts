
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
    muted: boolean; //I renamed 'state' to 'descriptor'
    volume: number; //- but maybe things like this belong to a 'state'
    duration: number; //(not this, though)
    //seek time, cue points...
    //VideoPlaybackQuality...
}
export class VideoDescriptor implements IVideoDescriptor {
    muted: boolean;
    volume: number;
    duration: number;
    url: string;
    width: number;
    height: number;
    imgType: ImageType;
    rotation?: ImRot;
    constructor(url: string, data: any) {
        this.url = url; //nb, we may want to pass info differently...
        this.imgType = ImageType.VideoFile;
        if (!data.streams) throw new Error(`no streams`);
        const streams = data.streams as object[];
        const vidStream = streams.find(
            (s: any) => s["codec_type"] === "video"
        ) as any;
        if (!vidStream) throw new Error(`no video stream`);
        this.width = vidStream.width;
        this.height = vidStream.height;
        this.duration = Number.parseFloat(vidStream.duration);
        this.muted = true;
        this.volume = 1;
        if (vidStream.side_data_list) {
            const rotation = vidStream.side_data_list[0].rotation;
            if (rotation) this.rotation = rotation;
            //now that I understand this, I think I want to change the order of how things are set...
            //generally more of this Descriptor pushed to the renderer...
        }
    }
}

//for future implementation: not exported until implemented.
interface ImageFeedbackState extends AbstractImageDecriptor {}
interface CameraStreamState extends AbstractImageDecriptor {}
interface WebRTCStreamState extends AbstractImageDecriptor {}
