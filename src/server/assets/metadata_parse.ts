/**
 * Extraction of metadata from media files.
 * 
 * FFProbe via node-ffprobe & @ffprobe-installer/ffprobe
 * vs mp4, mux.js? Latter looks like a well-maintained option
 * but I went off it for inital attempt because of lack of types & complexity for what I need
 * 
 */

//import * as muxjs from 'mux.js'
import ffprobe from 'ffprobe-client'
import main_state from '../main_state'

//Error: Could not find ffprobe executable, tried 
//"C:\code\thus-is-lit\public\win32-x64\ffprobe.exe" and 
//"C:\code\thus-is-lit\public\build\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe"
//need to adapt watch.js... make @ffprobe-installer external
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import { VideoDescriptor } from '../../common/media_model';

function recordDebugMetadata(filename: string, data: any) {
    if (main_state.videoMetadataRaw.some(m => m.format.filename === filename)) return;
    main_state.videoMetadataRaw.push(data);
}

export async function probeRawMetadata(filename: string) {
    // const m = new muxjs.mp4.Probe({})
    console.log(`probing ${filename}...`);
    try {
        const data = await ffprobe(filename, {path: ffprobePath});
        //console.log(JSON.stringify(data, null, 2));
        recordDebugMetadata(filename, data);
        return data;
    } catch (error) {
        console.error(`error parsing metadata for ${filename}`)
    }
}

export default async function probeVideoMetadata(filename: string) : Promise<VideoDescriptor> {
    const data = await probeRawMetadata(filename);
    const info = new VideoDescriptor(filename, data); //nb, fairly like to throw an error.
    //for quick debugging... if we really keep state like this about, we'd also want to use it as a cache
    if (!main_state.videoMetadataParsed.includes(info)) main_state.videoMetadataParsed.push(info);
    return info;
}
