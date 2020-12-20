import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const currentVersion = "0.0.1";

const homePath = path.join(os.homedir(), '/thusislit');
const configPath = path.join(homePath, 'config.json');

interface FileConfigPrefs {
    mainAssetPath?: string;
    //associate names with locations?
    //not adding fancy features that I won't be testing yet.
    //but I'd like to be able to make a request to "TITK/someFile" 
    //and it should look up someFile in the TITK configured on that machine.
    //but then again if we seriously get in to asset management then we probably want an sqlite db
    //or whatever... but anyway, not today.
    //contentLibs?: Record<string, string>; 
    version: string; //no clear spec for reasoning about this yet...
}

//MobX? ...
class FileConfigPrefsModel implements FileConfigPrefs {
    _version: string;
    constructor(initial?: FileConfigPrefs) {
        this._version = initial.version;
    }
    public get version() {
        return currentVersion;
    }
}

let config: FileConfigPrefs;

async function initConfigFile() {
    const confExists = await fs.existsSync(path.join(homePath, 'config.json'));
    if (confExists) return fs.promises.readFile(configPath, 'utf-8');
    
    try {
        const stat = await fs.promises.stat(homePath);
        if (!stat.isDirectory) {
            await fs.promises.mkdir(homePath);
        }
        await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig()));
    } catch (error) {
        console.error(`[file_config error] '${error}'`);
    }
}

async function getConfig() : Promise<FileConfigPrefs> {
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
