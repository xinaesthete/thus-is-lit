// this file is starting to have too many separate areas of concern:
// should be broken up
// I make BrowserWindows in here, which seems fishy.
/// express API
/// fileserver (with hot-reloading of code, config of asset paths etc)
/// websocket comms for control changes...

import express from 'express';
import * as net from '@common/network_addresses';
import * as screen_server from './screen_config';
import initFileConfig, * as file_config  from './assets/file_config';
import * as media_server from './assets/media_server';
import main_state, { getStateAsJsonString } from './main_state';
import startWsServer from './ws_server';
import { networkInterfaces } from 'os';
import path from 'path';
import cors from 'cors';


//technically, this could change if network interface changes while app is running.
/// ** may be another reason not to try to use a flaky wifi hotspot from phone during gig **
const findAddress = () => {
    try {
        const arr = ([] as any[]).concat(...Object.values(networkInterfaces()));
        const filtered = arr.filter(details => details.family === 'IPv4' && !details.internal);
        if (filtered.length) return filtered.shift().address;
        return 'localhost';
    } catch (err) {
        console.error('unexpected error finding localRemoteIP, reverting to localhost', err);
        return 'localhost';
    }
};
let localExternalIP = findAddress();
////https://vitejs.dev/guide/env-and-mode.html
//TODO: better use of env.
//need to decide how to get in here - simpler ways with vite config.
//would be better not to hard-code devServer port.
const devMode: boolean = (import.meta as any).env?.DEV || false;
console.log('--- DEV : ' + devMode);

net.setAddr(localExternalIP, devMode); //ugh
setInterval(() => {
    const newIP = findAddress();
    if (newIP !== localExternalIP) {
        console.log(`changing network from ${localExternalIP} to ${newIP}`);
        localExternalIP = newIP;
        //not currently reflected in GUI even after refresh
        net.setAddr(localExternalIP, devMode);
    }
}, 1000);

export const expApp = express();
expApp.use(express.urlencoded({extended: false}));//...
expApp.use(express.json());
expApp.use(express.text({type: 'text/*'}));
expApp.use(cors());

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
    const server = expApp.listen(net.apiPort, () => {
        console.log(`express server listening at ${net.httpURL}`);
    });
    startWsServer(server);
    initFileConfig();
    if (!devMode) {
        ///nb::: using esbuild & serving from '/public'
        //some irregularity with vite_build (WHICH WE DON'T USE AT TIME OF WRITING).
        const staticPath = path.resolve(__dirname, '../');
        console.log('staticPath: ' + staticPath);
        expApp.use(express.static(staticPath));
    }
}
