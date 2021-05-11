import { app } from 'electron'
//import { version } from '../../../package.json' //why not working?
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { FileConfigPrefs } from '@common/media_model';
import express from 'express';
import { dialog } from 'electron'
import main_state from '../main_state';
import { expApp } from '../server_comms';

const currentVersion = require('../../package.json').version;
console.log(`currentVersion: ` + currentVersion);
let config: FileConfigPrefs;


export default async function setup() {
    console.log(`setting up file_config module, currentVersion "${currentVersion}"`);
    config = await getConfig();
    console.log(`config: ${await getConfigJsonString()}`);
}

export const homePath = path.join(os.homedir(), '/thusislit');
export const appPath = app.getAppPath();
export const appDataPath = path.join(app.getPath('appData'), '/thusislit');
export const tempPath = path.join(os.tmpdir(), '/thusislit');
export const configFilePath = path.join(appDataPath, 'config.json');

console.log(`homePath: ${homePath}`);
console.log(`appPath: ${appPath}`);
console.log(`appDataPath: ${appDataPath}`);
console.log(`tempPath: ${tempPath}`);

class FileConfigPrefsModel implements FileConfigPrefs {
    private _version: string;
    private _mainAssetPath: string;
    constructor(initial: FileConfigPrefs) {
        this._version = initial.version;
        this._mainAssetPath = initial.mainAssetPath || "";
    }
    public get version() {
        return this._version;
    }
    public get mainAssetPath() {
        return this._mainAssetPath;
    }
    public set mainAssetPath(newPath: string) {
        //MobX? ... maybe good to spend some time looking into that sooner than later
        //not that I shouldn't be able to be less stupid about serializing this anyway.
        this._mainAssetPath = newPath;
        fs.writeFileSync(configFilePath, JSON.stringify(
            //FFS
            {version: this.version, mainAssetPath: this.mainAssetPath}
        ));
    }
}

/** this fn should not have to exist, the FileConfigPrefsModel implementation is baad... */
export async function getConfigJsonString() {
    const c = await getConfig();
    return JSON.stringify({version: c.version, mainAssetPath: c.mainAssetPath});
}

async function isAcceptableAssetPath(path: string) {
    const exists = fs.existsSync(path);
    if (!exists) return false;
    const stat = await fs.promises.stat(path);
    return stat.isDirectory();
}

export function addRestAPI(expApp: express.Application) {
    expApp.post('/setMainAssetPath', async (req, res) => {
        //would be good to not just expose things like this too openly...
        //let's only consider accepting from localhost for a start. Hopefully that's secure enough for now.
        //I should test this.  Maybe use express-ipfilter?
    
        //perhaps more important is to consider the effects of changing this with the application running...
        /////// hypothesis:
        //// any running video streams will carry on regardless 
        //// anything that had previously failed won't start without a refresh
        //// I think I can live with that.
    
        const remoteIP = req.connection.remoteAddress;
        const newPath = req.body; ////needs to be a string
        if (!await isAcceptableAssetPath(newPath)) {
            res.sendStatus(403);
            console.error(`unacceptable asset path '${newPath}'`);
            return;
        }
        console.log(`[file_config] request to /setMainAssetPath to '${newPath}' from IP '${remoteIP}'`);
        // if (remoteIP === '127.0.0.1' || remoteIP === 'localhost') {
            const conf = await getConfig();
            conf.mainAssetPath = newPath;
            res.status(200).send(getConfigJsonString());
        // } else {
        //     console.error(`[file_config] refused request to change asset path.\nIP: '${remoteIP}'\tpath: '${newPath}'`);
        //     res.sendStatus(403).send(`not from that IP you don't...`);
        // }
    });

    //was thinking about something for realtime feedback while typing
    //but could be problematic, and I don't have more basic stuff working yet.
    // expApp.get('/checkPossibleAssetPath/:path', async (req, res) => {
    //     const ok = await isAcceptableAssetPath(req.params.path);
    //     res.sendStatus()
    // });
    
    expApp.get("/getConfigPrefs", async (req, res) => {
        console.log(`[file_config] received getConfigPrefs request`);
        try {
            let config = await getConfigJsonString();
            res.status(200).send(config);
        } catch (error) {
            const msg = `[file_config] error getting config: ${error};`
            console.error(msg);
            res.sendStatus(500);
        }
    });
    expApp.get("/openFileDialog", async (req, res) => {
        console.log(`/openFileDialog request`);
        const result = await dialog.showOpenDialog(main_state.mainWindow!, {
            title: "Choose the folder where you keep videos",
            properties: ["openDirectory"]
        });
        if (result.canceled) {
            console.log("file dialog canceled");
            res.sendStatus(500);
        } else {
            console.log(`file dialog result: ${result.filePaths[0]}`);
            res.status(200).send(result.filePaths[0]);
        }
    });
}




async function initConfigFile() {
    console.log(`[file_config] init config file`);
    //consider adding version to filename
    const confExists = await fs.existsSync(configFilePath);
    if (confExists) {
        console.log(`[file_config] using existing config`);
        await fs.promises.readFile(configFilePath, 'utf-8');
        return;
    }
    
    try {
        const stat = await fs.existsSync(appDataPath);
        if (!stat) {
            await fs.promises.mkdir(appDataPath);
        }
        await fs.promises.writeFile(configFilePath, JSON.stringify(defaultConfig()));
    } catch (error) {
        console.error(`[file_config error] '${error}'`);
    }
}

export async function getConfig() : Promise<FileConfigPrefs> {
    if (config) return config;
    await initConfigFile();
    try {
        const dataStr = await fs.promises.readFile(configFilePath, 'utf-8');
        const data = JSON.parse(dataStr);
        if (data.version) {
            config = new FileConfigPrefsModel(data as FileConfigPrefs);
            return config;
        }
        throw('robust config checks failed.'); // :rolleye:
    } catch (error) {
        console.error(`[file_config error] '${error}'`);
    }
    return {version: 'broken'}
}

function defaultConfig() : FileConfigPrefs {
    return {
        mainAssetPath: undefined, version: currentVersion
    }
}
