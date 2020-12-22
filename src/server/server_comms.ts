// this file is starting to have too many separate areas of concern:
// should be broken up
// I make BrowserWindows in here, which seems fishy.
/// express API
/// fileserver (with hot-reloading of code, config of asset paths etc)
/// websocket comms for control changes...

import { BrowserWindow } from 'electron';
import express from 'express'
import * as ws from 'ws'
import WebSocket from 'ws' //https://github.com/websockets/ws/issues/1583
import bodyParser from 'body-parser'
import * as consts from '../common/constants'
import KaleidModel from '../common/KaleidModel';
import { createRendererWindow } from './screen_config';
import * as screen_server from './screen_config';
import initFileConfig, * as file_config  from './assets/file_config'
import * as media_server from './assets/media_server'
import { OscCommandType } from '../common/socket_cmds';
import { buildDir } from '.';
import { watchFragmentShader } from './code_watch';
import { currentModels } from './main_state';


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
// expApp.post('/setMainAssetPath', file_config.post_setMainAssetPath);
// expApp.get('/getConfigPrefs', file_config.get_getConfigPrefs);
media_server.addRestAPI(expApp);
// expApp.get('/video/:id', media_server.getVideo);
// expApp.get('/listvideos', media_server.listvideos);
screen_server.addRestAPI(expApp);
expApp.get('/modelList', async (req, res) => {
    console.log(`GET /modelList`);
    const v = [...currentModels.values()];
    res.send(v);
});


export function start() {
    console.log("initialising server_comms...");
    //this file could be very simple, and call a few modules one by one...
    const server = expApp.listen(consts.host_port, () => {
        console.log(`express server listening at ${consts.httpURL}`);
    });
    initFileConfig();


    const wsServer = new ws.Server({server: server});
    /// -> main_state
    const renderers: Map<number, WebSocket> = new Map();
    const playbackTimes = new Map<number, number>();
    const controllers: WebSocket[] = [];
    //const models: Map<number, KaleidModel> = new Map(); // we could never remove from this and it'll be fine for the time being.
    // ->
    watchFragmentShader((newCode) => {
        const msg = JSON.stringify({address: 'fragCode', code: newCode});
        for (let r of renderers.values()) r.send(msg);
    });

    const msgCmds = new Map<OscCommandType, (socket: WebSocket, msg: any)=>Promise<void>>();
    msgCmds.set(OscCommandType.ReportTime, async (socket, msg) => {
        playbackTimes.set(msg.id, msg.time);
    });

    wsServer.on('connection', (socket) => {
        console.log(`new ws connection:::`);
        socket.onclose = (closedEvent) => {
            const { code, reason, target } = closedEvent;
            // code 1000 - normal closure, 1001 going away, 1012 service restart...
            console.log(`[ws] socket close ${reason}`);
            ///remove from collections...
            if (controllers.includes(target)) controllers.splice(controllers.indexOf(target),1);
            //if (renderers.values...)) //lodash?....
        };
        socket.on('message', message => {
            try {
                const json = JSON.parse(message as string); //TODO pass to type-annotated function.

                // maybe put all of these into msgCmds?
                if (json.address === OscCommandType.RegisterRenderer) {
                    console.log(`[ws] registering renderer...`);
                    if (json.id === undefined) console.error(`malformed message '${message}'`); //why--->
                    else {
                        if (renderers.has(json.id)) {
                            console.log(`[ws] already had socket for renderer #${json.id}`);
                            //will the old one safely become garbage and be disposed? probably.
                            renderers.set(json.id, socket);
                            const msg = JSON.stringify({model: currentModels.get(json.id), address: OscCommandType.Set, time: playbackTimes.get(json.id)});
                            //console.log(`[ws] restoring state ${msg}`);
                            socket.send(msg); //I should at least review when it's necessary to stringify.
                        }
                        renderers.set(json.id as number, socket); //but it *is* *a* *we*b*b*socket /sob
                        console.log(`[ws] ${json.id} socket established`);
                    }
                } else if (json.address === OscCommandType.RegisterController) {
                    console.log(`registering controller`);
                    controllers.push(socket);
                    //report back to it about all of the renderers (models) that are about.
                    //really what we mean is: let it know everything it needs to about the state of the application.
                    const msg = JSON.stringify({address: OscCommandType.ModelList, models: currentModels.values});
                    socket.send(msg);
                } else if (json.address === OscCommandType.Set) {
                    // console.log(`[ws] /set id=${json.model.id} command...`);
                    const model = json.model as KaleidModel;
                    currentModels.set(model.id, model);
                    if (renderers.has(model.id)) {
                        //// model.id is undefined but we're still trying to send...
                        // const vals = model.tweakables.
                        //     map(t => `${t.name}:\t\t${JSON.stringify(t.value)}`).join('\n  ');
                        // console.log(`[ws] forwarding set message \n  ${vals}`);
                        renderers.get(model.id).send(message);
                    }
                } else {
                    if (msgCmds.has(json.address)) msgCmds.get(json.address)(socket, json); //maybe I could associate OscCommandType with message type.
                    else console.log(`[ws] message not handled: ${message}`);
                }
            } catch (e) {
                console.error(`[ws] message '${message}' not json string`);
            }
        });
    });


    // server.on('upgrade', (request, socket, head) => {
    //     wsServer.handleUpgrade((request, socket, head) => {
    //         wsServer.emit('connection', socket, request);
    //     });
    // })
}
