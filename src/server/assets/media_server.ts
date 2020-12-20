import { expApp } from '../server_comms'
import * as config from './file_config'
import * as fs from 'fs'

expApp.get('/video/load', async function(req, res) {
    const path = ''; //TBD
    const stat = await fs.promises.stat(path);
    
    if (!stat.isFile) {
        res.status(404).send(`couldn't load video ${path}`);
        return;
    }

    const fileSize = stat.size;
    const contentType = 'video/mp4'; //or... we could try to determine this for specific content...
    res.writeHead(200, {
        'Content-Length': fileSize, 'Content-Type': contentType
    });
    fs.createReadStream(path).pipe(res);
});

expApp.get('/video/list', async function(req, res) {

})


