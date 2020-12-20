/** port used by express server, may want to consider setting this differently */
export const host_port = 8321;
//export const ws_port = 8322;

// addresses of server API calls:

/** GET for requesting that a new renderer output window be created */
export const newRenderer = "/newRenderer";
/** POST that a new renderer window has been created, with info about its model */
export const rendererStarted = "/rendererStarted";
//I thought it might be nice to have a central place where they were defined, avoid typos etc...
//but now it seems like maybe an unnecessary burden, especially as they're named in a way that 
//mistakes can easily be made with these constants vs internal server functions etc.
//export const getConfigPrefs = "/getConfigPrefs";
//TODO SSL.
//TODO consider server not on localhost
export const websocketURL = "ws://localhost:" + host_port;
export const httpURL = "http://localhost:" + host_port;