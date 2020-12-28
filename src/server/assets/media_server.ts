import * as config from './file_config'
import probeMp4 from './metadata_parse'
import * as fs from 'fs'
import * as path from 'path'
import { Dirent } from 'original-fs';
import express from 'express';
import { httpURL } from '../../common/constants';

const mimeTypes = {
    html: 'text/html; charset=utf-8',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    js: 'text/javascript',
    css: 'text/css',
    mp4: 'video/mp4',
};

const vidMimeTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    //mts, mkv...
    //-- instv -- ??
    insv: 'video/mp4' //might just be mad enough to work?
}
const imageMimeTypes = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    insp: "image/jpeg", //might just be mad enough to work?
};
const mediaMimeTypes = {
    'video': vidMimeTypes,
    'image': imageMimeTypes
}
type MediaType = 'video' | 'image';
function validExtensions(type: MediaType) {
    return Object.keys(mediaMimeTypes[type]).map(e => '.'+e);
}
function hasValidExtention(name: string, type: MediaType) {
    return validExtensions(type).includes(path.extname(name));
}

async function getMediaList(type: MediaType) {
    const root = await(await config.getConfig()).mainAssetPath!;
    const t = Date.now();
    console.log(`[media_server] listing ${type}s from ${root}`);

    //TODO let's give them some metadata as well
    const files: string[] = type === 'video' ? ["red.mp4"] : [];
    const validExt = validExtensions(type);
    const hidden = (n: string) => n[0] === ".";
    //we want more filetypes supported...
    const isValid = (d: Dirent) =>
        !hidden(d.name) && validExt.includes(path.extname(d.name));
    const dFilter = (d: Dirent) => {
        if (d.isDirectory()) return true;
        if (d.isFile()) return isValid(d);
        return false;
    };
    function expand(d: Dirent, dir: string) {
        //need path of parent relative to root too.
        // console.log(`expanding ${dir}/${d.name}...`);
        const pathFromAssetRoot = path.join(dir, d.name);
        const absDir = path.join(root, dir, d.name);
        if (isValid(d)) {
        // console.log(`<<adding>> '${pathFromAssetRoot}'`);
        //trying to get this so that URL is in the form expected by server
        ///might change with e.g. different named asset locations
        files.push(encodeURI(`${httpURL}/${type}/${pathFromAssetRoot}`));
        } else {
        const children = fs.readdirSync(absDir, { withFileTypes: true });
        children
            .filter(dFilter)
            .forEach(async (d2) => expand(d2, pathFromAssetRoot));
        }
    }
    //root may be undefined if there's no config set?
    let dirList = await fs.promises.readdir(root, { withFileTypes: true });
    dirList.filter(dFilter).forEach((d) => expand(d, ""));
    // useful for stress-test, not intended for release.
    // try {
    //     //when this blocks, it totally blocks main GUI.
    //     //also disrupts streaming - could consider streaming in separate process?
    //     await Promise.all(files.slice(0).map(probeMp4));
    // } catch (e) {
    //     console.error(e);
    // }
    console.log(`finished list&probe of ${files.length} files in ${Date.now()-t}ms`);
    return files;
}


export function addRestAPI(expApp: express.Application) {
    //https://medium.com/better-programming/video-stream-with-node-js-and-html5-320b3191a6b6
    expApp.get('/video/*', async (req, res) => {
        //tried to use '/video/:id' & req.params.id but params, but complex paths get 404,
        //without hitting this route - maybe there's a way of expressing what I wanted with parameters
        const id = decodeURI(req.url.substring(7));
        //(and maybe there's another flaw with this if it lets you walk back up into the FS "../../")
        //do I need to add some middleware to express to decode URI?
        if (id.startsWith('..') || id.startsWith('/')  || id.startsWith('\\')) {
            res.status(403).send();
        }
        
        // console.log(`[media_server] (trying to) serve video ${id}`);
        const c = await config.getConfig();
        if (!c.mainAssetPath) {
            res.status(404).send(`asset path hasn't been configured`);
        }
        const vidPath = id==="red.mp4" ? "red.mp4" : path.join(c.mainAssetPath||"", id);
        // probeMp4(req.url);
        const ext = path.extname(vidPath);
        if (!hasValidExtention(vidPath, 'video')) {
            res.send(404).send(`can't server ${id} as video`);
            return;
        }
        const typeKey = path.extname(vidPath).substring(1) as 'mp4' | 'mov' | 'webm'; //sorry
        // const contentType = vidMimeTypes[typeKey];
        try {
            const stat = await fs.promises.stat(vidPath);
            
            if (!stat.isFile) {
                res.status(404).send(`couldn't load video, file not found '${vidPath}'`);
                return;
            }
            
            //seems like we don't need to handle logic of handling ranges etc, node will do it for us.
            //// what about insv though? Seems fine without bothering to ovveride Content-Type
            res.sendFile(vidPath);
            return;
        } catch (error) {
            res.status(500).send(`error '${error}' reading ${vidPath}`);
        }
    });

    expApp.get('/videoDescriptor/*', async (req, res) => {
        const id = decodeURI(req.url.substring('/videoDescriptor/'.length))
        const info = await probeMp4(id);
        res.send(info);
    });
        
    /** respond with a flat array of mp4s contained under mainAssetPath */
    expApp.get('/videoList', async (req, res) => {
        const t = Date.now();
        const files = await getMediaList('video');
        console.log(`[media_server] returning video list length ${files.length} (took ${Date.now()-t}ms)`);
        res.send(files);    
    });
    
    expApp.get('/image/*', async (req, res) => {
        const id = decodeURI(req.url.substring(7));
        //(and maybe there's another flaw with this if it lets you walk back up into the FS "../../")
        //do I need to add some middleware to express to decode URI?
        if (id.startsWith("..") || id.startsWith("/") || id.startsWith("\\")) {
            res.status(403).send();
        }

        console.log(`[media_server] (trying to) serve image ${id}`);
        const c = await config.getConfig();
        if (!c.mainAssetPath) {
            res.status(404).send(`asset path hasn't been configured`);
        }
        const imgPath = path.join(c.mainAssetPath || "", id);
        const ext = path.extname(imgPath);
        if (!hasValidExtention(imgPath, "image")) {
            res.send(404).send(`can't server ${id} as image`);
            return;
        }
        const typeKey = path.extname(imgPath).substring(1) as
            | "jpeg"
            | "jpg"
            | "png"; //sorry
        const contentType = imageMimeTypes[typeKey]; //sendFile does this automatically.
        try {
            res.sendFile(imgPath);
            return;
        } catch (e) {
            console.error(`error '${e}' serving image ${imgPath}`);
        }

    });

    expApp.get('/imageList', async function (req, res) {
        const t = Date.now();
        const files = await getMediaList('image');
        console.log(`[media_server] returning image list length ${files.length} (took ${Date.now()-t}ms)`);
        res.send(files);    
    });

}
