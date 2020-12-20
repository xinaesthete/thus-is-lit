import { expApp } from '../server_comms'
import * as config from './file_config'
import * as fs from 'fs'
import * as path from 'path'

const mimeTypes = {
    html: 'text/html; charset=utf-8',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    js: 'text/javascript',
    css: 'text/css',
    mp4: 'video/mp4'
};


//https://medium.com/better-programming/video-stream-with-node-js-and-html5-320b3191a6b6
expApp.get('/video/:id', async function (req, res) {
    const id = req.params.id;
    const c = await config.getConfig();
    if (!c.mainAssetPath) {
        res.status(404).send(`asset path hasn't been configured`);
    }
    const vidPath = path.join(c.mainAssetPath, id);
    const stat = await fs.promises.stat(vidPath)
    
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
});


expApp.get('/listvideos', async function (req, res) {
    
})
