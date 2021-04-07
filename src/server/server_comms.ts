// this file is starting to have too many separate areas of concern:
// should be broken up
// I make BrowserWindows in here, which seems fishy.
/// express API
/// fileserver (with hot-reloading of code, config of asset paths etc)
/// websocket comms for control changes...

import express from 'express'
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
expApp.use(express.urlencoded({extended: false}));//...
expApp.use(express.json());
expApp.use(express.text({type: 'text/*'}));


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
