import { makeObservable } from "mobx";
import { observable, action } from "mobx";
import * as API from "./gui_comms";

class MediaLibrary {
    mainAssetPath: string = "";
    availableVideos: string[] = ['red.mp4'];

    constructor() {
        makeObservable(this, {
            //somewhat prefer @decorator style, but it's warned against currently
            //(probably still going to go ahead with it elsewhere)
            mainAssetPath: observable,
            //really, this should be 'computed' as an async result of changing mainAssetPath
            //but this is not a simple case for mobx... 'computed-async-mobx' requires older mobx...
            //hmmm. maybe I'm making life hard for myself.
            availableVideos: observable,
            setMainAssetPath: action,
            setAvailableVideos: action
        });
        API.requestFileConfigPrefs().then(c => {
            this.setMainAssetPath(c.mainAssetPath!);
        })
    }
    setMainAssetPath(newPath: string) {
        const oldPath = this.mainAssetPath;
        this.mainAssetPath = newPath;
        API.requestSetMainAssetPath(newPath).then(async ok => {
            if (ok) {
                //nb, mobx complained about setting not from an action, presumably because of async
                //so calling another action rather than setting availableVideos directly.
                this.setAvailableVideos(await API.requestVideoList());
            } else {
                console.error(`failed to set asset path ${newPath}, reverting to ${oldPath}`);
                //mobx might complain about this async change:
                this.mainAssetPath = oldPath;
            }
        });
    }
    setAvailableVideos(newVids: string[]) {
        this.availableVideos = newVids;
    }
}

export const mediaLib = new MediaLibrary();
