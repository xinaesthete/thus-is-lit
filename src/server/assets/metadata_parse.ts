/**
 * Extraction of metadata from media files.
 * 
 * Was using FFProbe, but mediainfo.js is leaner, so switched.
 * Maybe if I have a wider need for FFMPEG then I'll consider bundling it in again.
 */

//import * as muxjs from 'mux.js'
//import ffprobe from 'ffprobe-client'
import MediaInfo from 'mediainfo.js'
import { promises as fs } from 'fs'
import main_state from '../main_state'

import { ImageType, IVideoDescriptor, VideoDescriptor } from '@common/media_model'
import * as path from 'path'
import { getConfig } from './file_config'
import { getFilePathForUrl } from './media_server'

function recordDebugMetadata(filename: string, data: any) {
    if (main_state.videoMetadataRaw.some(m => m.format.filename === filename)) return;
    main_state.videoMetadataRaw.push(data);
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
/** CURRENTLY UNUSED */
export default async function probeVideoMetadata(url: string) : Promise<IVideoDescriptor> {
    const cached = main_state.videoMetadataParsed.find(i=>i.url===url); //TODO: cache to catalog db...
    if (cached) return cached;
    let id = decodeURI(url.substring(url.indexOf('/video/') + 7));
    let filename = await getFilePathForUrl(url); //not actually checked
    const data1 = await probeMediaInfo(filename);
    const parsed = parseMediaInfoVideoDescriptor(url, data1);
    const info = new VideoDescriptor(url, parsed);
    if (!main_state.videoMetadataParsed.find(i=>i.url==url)) main_state.videoMetadataParsed.push(info);
    return info;
}

/** if a video has been 'starred', retrieve the corresponding json,
 * otherwise undefined
 */
export async function getModelSidecar(url: string) {
    const p = await getFilePathForUrl(url + '.barb.json');
    console.log('path: ', p);
    try {
        //may be better to sendFile() to the request.
        const f = await fs.readFile(p, 'utf-8');
        console.log('so far so good...');
        //might be more efficient to keep it as a Buffer and send back...
        //might be a nuisance.
        return f;
    } catch (err){
        console.log('no sidecar for ' + p);
    }
}