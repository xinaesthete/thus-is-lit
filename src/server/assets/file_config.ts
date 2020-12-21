import { expApp } from '../server_comms'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { FileConfigPrefs } from '../../common/media_model';

const currentVersion = "0.0.1";
let config: FileConfigPrefs;


export default async function setup() {
    console.log(`setting up file_config module, currentVersion "${currentVersion}"`);
    config = await getConfig();
    console.log(`config: ${await getConfigJsonString()}`);
}

const homePath = path.join(os.homedir(), '/thusislit');
const configPath = path.join(homePath, 'config.json');

class FileConfigPrefsModel implements FileConfigPrefs {
    private _version: string;
    private _mainAssetPath: string;
    constructor(initial?: FileConfigPrefs) {
        this._version = initial.version;
        this._mainAssetPath = initial.mainAssetPath;
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
        fs.writeFileSync(configPath, JSON.stringify(
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

//expApp.post('/setMainAssetPath', async (req, res) => {
export const post_setMainAssetPath = async (req, res) => {
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
    if (!await isAcceptableAssetPath(newPath)) res.sendStatus(403);
    console.log(`[file_config] request to /setMainAssetPath to '${newPath}' from IP '${remoteIP}'`);
    // if (remoteIP === '127.0.0.1' || remoteIP === 'localhost') {
        const conf = await getConfig();
        conf.mainAssetPath = newPath;
        res.send(getConfigJsonString());
    // } else {
    //     console.error(`[file_config] refused request to change asset path.\nIP: '${remoteIP}'\tpath: '${newPath}'`);
    //     res.sendStatus(403).send(`not from that IP you don't...`);
    // }
};

//was thinking about something for realtime feedback while typing
//but could be problematic, and I don't have more basic stuff working yet.
// expApp.get('/checkPossibleAssetPath/:path', async (req, res) => {
//     const ok = await isAcceptableAssetPath(req.params.path);
//     res.sendStatus()
// });


// expApp.get("/getConfigPrefs", async (req, res) => {
export const get_getConfigPrefs = async (req, res) => {
    console.log(`[file_config] received getConfigPrefs request`);
    try {
        let config = await getConfigJsonString();
        res.send(config);
    } catch (error) {
        const msg = `[file_config] error getting config: ${error};`
        console.error(msg);
        res.sendStatus(500);
    }
};


async function initConfigFile() {
    console.log(`[file_config] init config file`);
    //consider adding version to filename
    const confExists = await fs.existsSync(path.join(homePath, 'config.json'));
    if (confExists) {
        console.log(`[file_config] using existing config`);
        await fs.promises.readFile(configPath, 'utf-8');
        return;
    }
    
    try {
        const stat = await fs.existsSync(homePath);
        if (!stat) {
            await fs.promises.mkdir(homePath);
        }
        await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig()));
    } catch (error) {
        console.error(`[file_config error] '${error}'`);
    }
}

export async function getConfig() : Promise<FileConfigPrefs> {
    if (config) return config;
    await initConfigFile();
    try {
        const dataStr = await fs.promises.readFile(configPath, 'utf-8');
        const data = JSON.parse(dataStr);
        if (data.version) {
            config = new FileConfigPrefsModel(data as FileConfigPrefs);
            return config;
        }
        throw('robust config checks failed.'); // :rolleye:
    } catch (error) {
        console.error(`[file_config error] '${error}'`);
    }
}

function defaultConfig() : FileConfigPrefs {
    return {
        mainAssetPath: undefined, version: currentVersion
    }
}
