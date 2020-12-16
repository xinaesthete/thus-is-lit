/** port used by express server, may want to consider setting this differently */
export const port = 8321;

// addresses of server API calls:

/** GET for requesting that a new renderer output window be created */
export const newRenderer = "/newRenderer";
/** POST that a new renderer window has been created, with info about its model */
export const rendererStarted = "/rendererStarted";
