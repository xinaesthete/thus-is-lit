import { makeObservable } from "mobx";
import { observable, action } from "mobx";
import * as API from "./gui_comms";

export class MediaLibrary {
    mainAssetPath: string = "";
    availableVideos: string[] = ['red.mp4'];

    constructor() {
        makeObservable(this, {
            mainAssetPath: observable,
            //really, this should be 'computed' as an async result of changing mainAssetPath
            //but this is not a simple case for mobx... 'computed-async-mobx' requires older mobx...
            //hmmm. maybe I'm making life hard for myself.
            availableVideos: observable,
            setMainAssetPath: action
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
                this.availableVideos = await API.requestVideoList();
            } else {
                console.error(`failed to set asset path ${newPath}, reverting to ${oldPath}`);
                this.mainAssetPath = oldPath;
            }
        });
    }
}

export const mediaLib = new MediaLibrary();
