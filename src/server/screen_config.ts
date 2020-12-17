import {app, screen} from 'electron'

let displays: Electron.Display[];

app.on('ready', () => {
    displays = screen.getAllDisplays();
    screen.addListener('display-added', (event, newDisplay) => {
        displays.push(newDisplay);
    })
    
    screen.addListener('display-removed', (event, removedDisplay) => {
        //TODO... don't want to put something in here & not test it 
        //then get an unhandled exception later
    })
    
    screen.addListener('display-metrics-changed', (event, display) => {
    
    })
});


let i = 0;
export function getNextScreen() {
    return displays[i++ % displays.length];
}
