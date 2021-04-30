/** port used by express server, may want to consider setting this differently */
export const host_port = 8321;
//export const ws_port = 8322;

// addresses of server API calls:

/** POST that a new renderer window has been created, with info about its model */
export const rendererStarted = "/rendererStarted";
//I thought it might be nice to have a central place where they were defined, avoid typos etc...
//but now it seems like maybe an unnecessary burden, especially as they're named in a way that 
//mistakes can easily be made with these constants vs internal server functions etc.
//export const getConfigPrefs = "/getConfigPrefs";
//TODO SSL.

//XXXX_____ this 'constants' thing has been made tricky by node vs browser stuff...
/// some ugliness below.
console.log(globalThis.location?.host);
export let addr = globalThis.location?.host;
//Protocol-relative '//' URLs?
export let websocketURL = `ws://${addr}`;
export let httpURL = `http://${addr}`;
export let guiURL = `http://${addr}/gui.html`;
export function setAddr(v: string) { 
  addr = v;
  websocketURL = `ws://${addr}`;
  httpURL = `http://${addr}`;
  guiURL = `http://${addr}/gui.html`;
}////ungood
