import { Server } from 'http'
import ws from "ws";
import WebSocket from 'ws' //https://github.com/websockets/ws/issues/1583
import KaleidModel from "../common/KaleidModel";
import { OscCommandType } from "../common/socket_cmds";
import { watchFragmentShader } from "./code_watch";
import main_state from "./main_state";


export default function startWsServer(server: Server) {
    const {renderers, currentModels, playbackTimes, controllers} = {...main_state};

    watchFragmentShader((newCode) => {
        const msg = JSON.stringify({address: 'fragCode', code: newCode});
        for (let r of renderers.values()) r.send(msg);
    });
    
    const msgCmds = new Map<OscCommandType, (socket: WebSocket, msg: any)=>Promise<void>>();
    msgCmds.set(OscCommandType.ReportTime, async (socket, msg) => {
        playbackTimes.set(msg.id, msg.time);
    });
    
    const wsServer = new ws.Server({server: server});
    wsServer.on('connection', (socket) => {
        console.log(`new ws connection:::`);
        socket.onclose = (closedEvent) => {
            const { code, reason, target } = closedEvent;
            // code 1000 - normal closure, 1001 going away, 1012 service restart...
            // always 1001 when window reloading or 
            console.log(`[ws] socket close ${code} ${reason ? reason : ''}`);
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
                        renderers.get(model.id)!.send(message);
                    }
                } else {
                    if (msgCmds.has(json.address)) msgCmds.get(json.address)!(socket, json); //maybe I could associate OscCommandType with message type.
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