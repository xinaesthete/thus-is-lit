/**
 * Extraction of metadata from media files.
 * 
 * Using FFProbe, but mediainfo.js probably leaner, I could maybe switch.
 */

//import * as muxjs from 'mux.js'
import ffprobe from 'ffprobe-client'
import MediaInfo from 'mediainfo.js'
import { promises as fs } from 'fs'
import main_state from '../main_state'

//Error: Could not find ffprobe executable, tried 
//"C:\code\thus-is-lit\public\win32-x64\ffprobe.exe" and 
//"C:\code\thus-is-lit\public\build\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe"
//need to adapt watch.js... make @ffprobe-installer external
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import { ImageType, IVideoDescriptor, VideoDescriptor } from '../../common/media_model'
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
        const t = Date.now();
        const data = await ffprobe(filename, {path: ffprobePath});
        //console.log(JSON.stringify(data, null, 2));
        recordDebugMetadata(filename, data);
        console.log(`ffprobe took ${Date.now()-t}ms`);
        return data;
    } catch (error) {
        console.error(`error parsing metadata for ${filename}`)
    }
}
function parseFFProbeVideoDescriptor(url: string, data: any) : IVideoDescriptor {
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
function parseMediaInfoVideoDescriptor(url: string, data: any) : IVideoDescriptor {
    const streams = data.media.track as object[];
    const vidStream: any = streams.find((s: any) => s['@type'] == "Video");
    if (!vidStream) throw new Error(`no video stream`);
    //nb, in MediaInfo we get Sampled_Height & Sampled_Width as well as Stored_Height...
    //other interesting fields: 
    //Encoded_Date, Tagged_Date, DisplayAspectRatio, BitDepth, ColorSpace, colour_range etc etc
    //there is also an @type 'General' with high-level info.
    const width = Number.parseInt(vidStream.Width);
    const height = Number.parseInt(vidStream.Height);
    const duration = Number.parseFloat(vidStream.Duration);
    const result: IVideoDescriptor = {width, height, duration, url, imgType: ImageType.VideoFile}

    if (vidStream.Rotation) {
        result.rotation = vidStream.Rotation;
    }
    return result;
}

async function probeMediaInfo(filename: string) {
    // const m = new muxjs.mp4.Probe({})
    console.log(`probing ${filename}...`);
    try {
        const t = Date.now();
        const fileHandle = await fs.open(filename, 'r');
        const fileSize = (await fileHandle.stat()).size;
        const readChunk = async (size: number, offset: number) => {
            const buffer = new Uint8Array(size);
            await fileHandle.read(buffer, 0, size, offset);
            return buffer;
        }
        const mediaInfo = await MediaInfo({format: 'object'});
        const data = await mediaInfo.analyzeData(()=>fileSize, readChunk);
        fileHandle.close();
        //console.log(JSON.stringify(data, null, 2));
        // fs.writeFile('mediaInfo.json', JSON.stringify(data, null, 2));
        //recordDebugMetadata(filename, data); //... needs attention
        console.log(`MediaInfo took ${Date.now()-t}ms`);
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
    let t = Date.now();
    const data = await probeRawMetadata(filename);
    
    /// experimenting with mediainfo.js, partly after noticing how much bloat ffprobe-installer
    /// adds with current build mechanism.
    /// unfortunately mediainfo.js is massively slower, which matters particularly 
    /// because at the moment we wait to get metadata back before switching video file.
    /// Should streamline that anyway, but still probably care a bit about 3-6x slowdown.
    /// Not sure what approach I'll take to 'streamlining' but is somewhat tied in with more
    /// media library functionality (cache info in catalog db...)

    // const tFFProbe = Date.now() - t;
    // t = Date.now();
    // const data1 = await probeMediaInfo(filename);
    // const tMediaInfo = Date.now() - t;
    // console.log(`mediainfo.js took ${tMediaInfo/tFFProbe}x as long as FFProbe`);
    // const parsed = parseMediaInfoVideoDescriptor(url, data);
    const parsed = parseFFProbeVideoDescriptor(url, data);
    const info = new VideoDescriptor(url, parsed);
    //for quick debugging... if we really keep state like this about, we'd also want to use it as a cache
    if (!main_state.videoMetadataParsed.find(i=>i.url==url)) main_state.videoMetadataParsed.push(info);
    // console.log(`done probing ${url}`);
    return info;
}
