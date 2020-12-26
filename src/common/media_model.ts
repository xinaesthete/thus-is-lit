
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

export interface AbstractImageState {
    width: number;
    height: number;
    imgType: ImageType; //seems logical for this to be generic type, 
    //but I need to figure out how to usefully use that at runtime.
    //also consider how to differentiate 360s / associated fisheye pairs...???
    //projection: 'plane' | 'equirectangular' | 'fisheye' ?? 'fisheyeA' | 'fisheyeB' ?
}

export interface ImageFileState extends AbstractImageState {
    url: string;
}

export interface VideoState extends ImageFileState {
    muted: boolean;
    volume: number;
    duration: number;
    //seek time, cue points...
    //VideoPlaybackQuality...
}

//for future implementation: not exported until implemented.
interface ImageFeedbackState extends AbstractImageState {}
interface CameraStreamState extends AbstractImageState {}
interface WebRTCStreamState extends AbstractImageState {}
