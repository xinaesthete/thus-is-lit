// this file is starting to have too many separate areas of concern:
// should be broken up
// I make BrowserWindows in here, which seems fishy.
/// express API
/// fileserver (with hot-reloading of code, config of asset paths etc)
/// websocket comms for control changes...

import express from 'express'
import bodyParser from 'body-parser'
import * as consts from '@common/constants'
import * as screen_server from './screen_config';
import initFileConfig, * as file_config  from './assets/file_config'
import * as media_server from './assets/media_server'
import main_state, { getStateAsJsonString } from './main_state';
import startWsServer from './ws_server';
import { networkInterfaces } from 'os'

//technically, this could change if network interface changes while app is running.
export const localExternalIP = (() => ([] as any[]).concat(...Object.values(networkInterfaces()))
  .filter(details => details.family === 'IPv4' && !details.internal)
  .shift().address)()

consts.setAddr(localExternalIP + ':' + consts.host_port); //ugh

export const expApp = express();
//https://stackoverflow.com/questions/52684372/fetch-post-request-to-express-js-generates-empty-body
//trying to figure out whether express.json() is enough, whether we need body-parser
//or why we shouldn't just have a JSON string and parse it ourselves.
//express depends on body-parser already, so it's not adding to node_modules.
//but it does seem to be adding to bundle size, largely because of iconv
//expApp.use(express.json());
expApp.use(bodyParser.urlencoded({extended: false}));//...
expApp.use(bodyParser.json());
//https://stackoverflow.com/questions/12497358/handling-text-plain-in-express-via-connect/12497793#12497793
//(second, more recent answer)
expApp.use(bodyParser.text({type: 'text/*'}));


file_config.addRestAPI(expApp);
media_server.addRestAPI(expApp);
screen_server.addRestAPI(expApp);
expApp.get('/modelList', async (req, res) => {
    console.log(`GET /modelList`);
    const v = [...main_state.currentModels.values()];
    res.send(v);
});
expApp.get('/getJsonState', async (req, res) => {
    console.log(`GET /getJsonState`);
    res.send(await getStateAsJsonString());
});

export function startServer() {
    console.log("initialising server_comms...");
    const server = expApp.listen(consts.host_port, () => {
        console.log(`express server listening at ${consts.httpURL}`);
    });
    startWsServer(server);
    initFileConfig();
    expApp.use(express.static('public'));
}
