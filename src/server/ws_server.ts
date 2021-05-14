import { Server } from 'http'
import {Server as ioServer} from 'socket.io'
import KaleidModel from "@common/KaleidModel";
import { API } from "@common/socket_cmds";
import { watchFragmentShader } from "./code_watch";
import main_state from "./main_state";
import { ParamValue } from '@common/tweakables';
import { createRendererWindow, toggleRendererFullscreen } from './screen_config';
import fs from 'fs';


export default function startWsServer(server: Server) {
    const {renderers, currentModels, playbackTimes, controllers} = {...main_state};
    
    const wsServer = new ioServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    });
    
    watchFragmentShader((newCode) => {
        wsServer.emit('/fragCode', {code: newCode});
    });
    
    
    wsServer.on('connection', (socket) => {
        console.log(`new ws connection:::`);
        socket.on('disconnect', (closedEvent) => {
            //const { code, reason, target } = closedEvent;
            // code 1000 - normal closure, 1001 going away, 1012 service restart...
            // always 1001 when window reloading or closed.
            // 1006 'abnormal closure' on sleep (at least on Windows)
            //console.log(`[ws] socket close ${code} ${reason ? reason : ''}`);
            ///remove from collections...
            if (controllers.includes(socket)) controllers.splice(controllers.indexOf(socket),1);
            //if (renderers.values...)) //lodash?....
        });
        socket.on(API.ReportTime, (msg: {id: number, time: number}) => {
            playbackTimes.set(msg.id, msg.time);
        });
        socket.on(API.RequestNewRenderer, async (vidUrl?: string) => {
            const m = await createRendererWindow(vidUrl); 
            wsServer.emit(API.RendererAdded, m);
        });
        socket.on(API.RegisterRenderer, (json: {id: number})=>{
            console.log(`[ws] registering renderer...`);
            if (json.id === undefined) console.error(`expected {id: number}`);
            else {
                if (renderers.has(json.id)) {
                    console.log(`[ws] already had socket for renderer #${json.id}`);
                    //will the old one safely become garbage and be disposed? probably.
                    renderers.set(json.id, socket);
                    console.log(`[ws] restoring state for #${json.id}`);
                    ///XXX::: not really working... (also not with emit, other things as well wrong)
                    socket.emit(API.Set, {model: currentModels.get(json.id), time: playbackTimes.get(json.id)})
                }
                renderers.set(json.id, socket);
                console.log(`[ws] ${json.id} socket established`);
            }
        });
        socket.on(API.RegisterController, ()=> {
            console.log(`registering controller`);
            //report back to it about all of the renderers (models) that are about.
            //really what we mean is: let it know everything it needs to about the state of the application.
            socket.send(API.ModelList, {models: currentModels.values}); ///??
        });
        socket.on(API.Set, (json: {model: KaleidModel})=> {
            const model = json.model;
            console.log('setting model ' + model.id);
            currentModels.set(model.id, model);
            //renderers.get(model.id)?.send(API.Set, json);
            socket.broadcast.emit(API.Set, json);
        });
        socket.on(API.SetParm, (msg: ParamValue<any>) => {
            if (!currentModels.has(msg.modelId)) throw (`trying to SetParm on unknown model ${msg.modelId}`);
            const model = currentModels.get(msg.modelId);
            const param = model?.tweakables.find(p => p.name === msg.key);
            if (param) param.value = msg.value;
            socket.broadcast.emit(API.SetParm, msg);
        });
        socket.on(API.SetVideoFilename, (msg: {url: string, modelId: number}) => {
            //somewhat works, but need more coherence in various ways...
            socket.broadcast.emit(API.SetVideoFilename, msg);
        });
        socket.on(API.Error, (json: {error: string})=> {
            main_state.lastError = json.error;
        });
        socket.on(API.StarVideo, (url: string) => {
            // in future I want to have something like a catalog db
            // and maybe I was thinking about putting it along with other bits of state I want to save in a more formal way
            // but NOW I want to be able to have a quick & dirty way to make a note of clips that I want to use.
            fs.appendFile('starred.txt', url+'\n', () => {
                console.log('starred: ', url);
            });
        });
        socket.on(API.Fullscreen, (id: number) => {
            toggleRendererFullscreen(id);
        });
    });
}
