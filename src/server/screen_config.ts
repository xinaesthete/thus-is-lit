import {app, screen} from 'electron'
import * as os from 'os'

let displays: Electron.Display[];

app.on('ready', () => {
    displays = screen.getAllDisplays();
    //at some point we may do something more with these listeners.
    screen.addListener('display-added', (event, newDisplay) => {
        displays = screen.getAllDisplays();
    })
    
    screen.addListener('display-removed', (event, removedDisplay) => {
        displays = screen.getAllDisplays();
    })
    
    screen.addListener('display-metrics-changed', (event, display) => {
    
    })
});


let i = 0;
export function getNextScreen() {
    //For some reason I think calling screen.getAllDisplays() felt like it may have been a bit slow
    //likely mis-diagnosis.
    return displays[i++ % displays.length];
}

export function useFullscreen() {
    return os.platform() !== 'win32';
}
