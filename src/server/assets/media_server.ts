import * as config from './file_config'
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
    mp4: 'video/mp4'
};

export function addRestAPI(expApp: express.Application) {
    expApp.get('/xvideo/:id', async function (req, res) {res.status(200).send(req.params.id)});
    
    
    //https://medium.com/better-programming/video-stream-with-node-js-and-html5-320b3191a6b6
    expApp.get('/video/*', async function (req, res) {
        //tried to use '/video/:id' & req.params.id but params, but complex paths get 404,
        //without hitting this route - maybe there's a way of expressing what I wanted with parameters
        //(and maybe there's another flaw with this if it lets you walk back up into the FS "../../")
        //do I need to add some middleware to express to decode URI?
        const id = decodeURI(req.url.substring(7));
        
        console.log(`[media_server] (trying to) serve video ${id}`);
        const c = await config.getConfig();
        if (!c.mainAssetPath) {
            res.status(404).send(`asset path hasn't been configured`);
        }
        const vidPath = id==="red.mp4" ? "red.mp4" : path.join(c.mainAssetPath, id);
        
        try {
            const stat = await fs.promises.stat(vidPath);
            
            if (!stat.isFile) {
                res.status(404).send(`couldn't load video, file not found '${vidPath}'`);
                return;
            }
            
            const fileSize = stat.size
            ///XXX: I think this range stuff might just be noise.
            //one of the answers here https://stackoverflow.com/questions/46625044/how-to-stream-a-m4v-video-with-nodejs
            //mentions 'strimming' with a simple res.status(200).sendFile()
            const range = req.headers.range
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-")
                const start = parseInt(parts[0], 10)
                const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1
                const chunksize = (end - start) + 1
                const file = fs.createReadStream(vidPath, { start, end })
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head)
                fs.createReadStream(vidPath).pipe(res);
            }
        } catch (error) {
            res.status(500).send(`error '${error}' reading ${vidPath}`);
        }
    });
    
    
    
    
    /** respond with a flat array of mp4s contained under mainAssetPath */
    expApp.get('/listvideos', async function (req, res) {
        const root = await (await config.getConfig()).mainAssetPath!;
    
        //TODO let's give them some metadata as well
        const files: string[] = ["red.mp4"];
        const hidden = (n: string) => n[0] === '.';
        const isVid = (d: Dirent) => !hidden(d.name) && path.extname(d.name) === '.mp4';
        const dFilter = (d: Dirent) => {
            if (d.isDirectory()) return true;
            if (d.isFile()) return isVid(d);
            return false;
        }
        //couldn't immediately think how to do async here.
        //--- in principle this is called only sporadically, during initialisation 
        //    or when changing config,
        //  : but this could easily go awry with unclear React logic etc.
        // -> in which case, the fact that this call will block the main server thread
        //    could be potentially rather bad...
        // I was feeling pretty thick when I first wrote this, so might take a moment to do it properly
        // or just cache the result and only recompute when config changes.
        // (nb, I ultimately want to watch the files as well and push change notifications to clients
        // but for an early version saying that you may need to restart if you rearrange video files is ok,
        // better than risk features that could cause unpredictable results during a gig)
        
        
        function expand(d: Dirent, dir: string) {  //need path of parent relative to root too.
            console.log(`expanding ${dir}/${d.name}...`);
            const pathFromAssetRoot = path.join(dir, d.name);
            const absDir = path.join(root, dir, d.name);
            if (isVid(d)) {
                console.log(`<<adding>> '${pathFromAssetRoot}'`);
                //trying to get this so that URL is in the form expected by server
                ///might change with e.g. different named asset locations
                files.push(encodeURI(`${httpURL}/video/${pathFromAssetRoot}`));
            }
            else {
                const children = fs.readdirSync(absDir, {withFileTypes: true});
                children.filter(dFilter).forEach(async d2 => expand(d2, pathFromAssetRoot));
            }
        }
        let dirList = await fs.promises.readdir(root, {withFileTypes: true});
        dirList.filter(dFilter).forEach(d => expand(d, ''));
        //console.log(`file listing:\n  ${files.join('\n  ')}\n------/listvideo`);
        console.log(`[media_server] returning listvideo length ${files.length}`);
        res.send(files);    
    });

}
