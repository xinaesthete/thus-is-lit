/** port used by express server, may want to consider setting this differently */
export const host_port = 8321;
//export const ws_port = 8322;

// addresses of server API calls:

/** GET for requesting that a new renderer output window be created */
export const newRenderer = "/newRenderer";
/** POST that a new renderer window has been created, with info about its model */
export const rendererStarted = "/rendererStarted";
//TODO SSL.
export const websocketURL = "ws://localhost:" + host_port;