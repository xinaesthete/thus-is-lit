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
console.log('location.host: ' + globalThis.location?.host);
//// this worked before because of proxy...
const host = globalThis.location?.host;
export let addr = `${globalThis.location?.hostname}:${apiPort}`;
//Protocol-relative '//' URLs?
export let websocketURL = `ws://${addr}`;
export let httpURL = `http://${addr}`;
export let guiURL = `http://${host}/index.html`; //gui.html`;
export let rendererURL = `http://${host}/renderer.html`;
export function setAddr(v: string, devMode: boolean) {
  httpPort = devMode ? httpPort : apiPort;
  addr = v;
  websocketURL = `ws://${addr}:${apiPort}`;
  httpURL = `http://${addr}:${apiPort}`;
  guiURL = `http://${addr}:${httpPort}/index.html`; //gui.html`;
  rendererURL = `http://${addr}:${httpPort}/renderer.html`;
}////ungood
