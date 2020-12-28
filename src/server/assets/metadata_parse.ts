/**
 * Extraction of metadata from media files.
 * 
 * Using FFProbe, but mediainfo.js probably leaner, I could maybe switch.
 */

//import * as muxjs from 'mux.js'
import ffprobe from 'ffprobe-client'
import main_state from '../main_state'

//Error: Could not find ffprobe executable, tried 
//"C:\code\thus-is-lit\public\win32-x64\ffprobe.exe" and 
//"C:\code\thus-is-lit\public\build\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe"
//need to adapt watch.js... make @ffprobe-installer external
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import { VideoDescriptor } from '../../common/media_model'
import * as path from 'path'
import { getConfig } from './file_config'

function recordDebugMetadata(filename: string, data: any) {
    if (main_state.videoMetadataRaw.some(m => m.format.filename === filename)) return;
    main_state.videoMetadataRaw.push(data);
}

async function probeRawMetadata(filename: string) {
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

//something very much like this should exist for AbstractImageDescriptor
export default async function probeVideoMetadata(url: string) : Promise<VideoDescriptor> {
    const id = decodeURI(url.substring(url.indexOf('/video/') + 7));
    // console.log(url );
    const filename = path.join((await getConfig()).mainAssetPath || "", id);
    const data = await probeRawMetadata(filename);
    const info = new VideoDescriptor(url, data); //nb, fairly like to throw an error.
    //for quick debugging... if we really keep state like this about, we'd also want to use it as a cache
    if (!main_state.videoMetadataParsed.find(i=>i.url==url)) main_state.videoMetadataParsed.push(info);
    // console.log(`done probing ${url}`);
    return info;
}
