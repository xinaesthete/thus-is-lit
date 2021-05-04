import test from '../server'

/**
 * Difference between how our app was in the past, and how electron-snowpack expects it to be:
 * 
 * File structure, this main/index.ts should just need to import something from 'server',
 * which will then initiate the app.
 * 
 * The app is using Express to serve HTML, will need to change that to the Snowpack dev server
 * may need to proxy any REST requests?
 * 
 * We still want to serve HTTP in built application so that remote iPad etc can connect.
 * 
 */