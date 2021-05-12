import { computed, makeObservable } from "mobx";
import { observable, action } from "mobx";
import { httpURL } from "@common/constants";
import { VideoDescriptor, AbstractImageDecriptor, IVideoDescriptor } from "@common/media_model";
import * as API from "./gui_comms";

class MediaLibrary {
    mainAssetPath: string = "";
    availableVideos: string[] = ['red.mp4'];
    imageDescriptors = new Map<string, AbstractImageDecriptor>();
    filter: (v: string)=>boolean = (v) => true;
    constructor() {
        makeObservable(this, {
            //somewhat prefer @decorator style, but it's warned against currently
            mainAssetPath: observable,
            //really, this should be 'computed' as an async result of changing mainAssetPath
            //but this is not a simple case for mobx... 'computed-async-mobx' requires older mobx...
            //hmmm. maybe I'm making life hard for myself.
            availableVideos: observable,
            imageDescriptors: observable,
            filter: observable,
            filteredVideos: computed,
            setMainAssetPath: action,
            setAvailableVideos: action,
            stringFilter: action,
            setDescriptorForAsset: action
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
                action(()=>this.mainAssetPath = oldPath);
            }
        });
    }
    async getDescriptorAsync(url: string) {
        if (this.imageDescriptors.has(url)) return this.imageDescriptors.get(url);
        const res = await fetch(`${httpURL}/videoDescriptor/${url}`);
        const info: IVideoDescriptor = await res.json();
        const desc = new VideoDescriptor(url, info);
        this.setDescriptorForAsset(url, desc);
        // return info as AbstractImageDecriptor;  //TODO validation.
        return desc;
    }
    setDescriptorForAsset(url: string, info: AbstractImageDecriptor) {
        this.imageDescriptors.set(url, info);
    }
    setAvailableVideos(newVids: string[]) {
        this.availableVideos = newVids;
        //nb what about imageDescriptors? should we clear the old ones? liable to leak, 
        //also incorrect to keep old keys around that could end up colliding with the new ones
        //but also nice to keep the cache, and in any case we want to change things up a bit
        //in terms of having more than one asset path, supporting other types of image...
    }
    get filteredVideos() {
        const list = this.availableVideos.filter(this.filter);
        console.log(`${list.length} filteredVidoes`);
        return list;
    }
    stringFilter(val: string) {
        const lval = val.toLowerCase();
        console.log(`[medialib] stringFilter: ${val}`);
        this.filter = (test) => test.toLowerCase().includes(lval);
    }
}

const notNice = `${httpURL}/video/`.length;
export const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
export const shortName = (v: string) => decodeURI(v.substring(v.lastIndexOf('/')));

const mediaLib = new MediaLibrary();
//// crude debugging to test video switching behaviour
//// indicates that sendVideoChange is fine but other stuff with VideoDescriptor et al is not.
// const switcher = setInterval(()=> {
//     const vids = mediaLib.availableVideos;
//     const i = Math.floor(Math.random() * vids.length);
//     API.sendVideoChange(vids[i], 0);
//     // props.setURL(vids[i]);
// }, 2000);

export default mediaLib;