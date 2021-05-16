import { API } from "./socket_cmds";

/** port used by express server, may want to consider setting this differently */
export const apiPort = 8321;
export let httpPort = 3000; //hardocded for devServer
//export const ws_port = 8322;

// addresses of server API calls:

/** POST that a new renderer window has been created, with info about its model */
export const rendererStarted = "/rendererStarted";
//I thought it might be nice to have a central place where they were defined, avoid typos etc...
//but now it seems like maybe an unnecessary burden, especially as they're named in a way that 
//mistakes can easily be made with these constants vs internal server functions etc.
//export const getConfigPrefs = "/getConfigPrefs";
//TODO SSL.

/// some ugliness below.
const location = globalThis.location;
console.log('location.host: ' + location?.host);
//setAddr was previously only called from server & other values left as init in clients
//Now we want electron gui clients to be started on localhost for secure context,
//but display QR codes to connect to remote on browsers in LAN.
//we pass the 'remote' ('local external IP') as a search parameter to facilitate this.
const searchParams = new URLSearchParams(location?.search);
const hostName = searchParams.get('remote') ?? location?.hostname;
if (hostName) setAddr(hostName, (import.meta as any).env?.DEV || false);
//Protocol-relative '//' URLs?
export let websocketURL: string;
export let httpURL: string;
export let remoteGuiURL: string;
export let remoteRendererURL: string;
export let localGuiURL: string;
export let localRendererURL: string;
export let rendererApiURL: string;
export function setAddr(v: string, devMode: boolean) {
  httpPort = devMode ? httpPort : apiPort;
  const addr = v;
  websocketURL = `ws://${addr}:${apiPort}`;
  httpURL = `http://${addr}:${apiPort}`;
  remoteGuiURL = `http://${addr}:${httpPort}/index.html`; //gui.html`;
  remoteRendererURL = `http://${addr}:${httpPort}/renderer.html`;
  rendererApiURL = `http://${addr}:${apiPort}${API.RequestNewRenderer}`;
  localGuiURL = `http://localhost:${httpPort}/index.html?remote=${addr}`;
  localRendererURL = `http://localhost:${httpPort}/renderer.html`;
}////ungood
