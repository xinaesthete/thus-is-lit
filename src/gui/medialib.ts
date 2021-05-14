import { computed, makeObservable } from "mobx";
import { observable, action } from "mobx";
import { httpURL } from "@common/constants";
import Fuse from 'fuse.js';
import { VideoDescriptor, AbstractImageDecriptor, IVideoDescriptor } from "@common/media_model";
import * as API from "./gui_comms";

class MediaLibrary {
    mainAssetPath: string = "";
    availableVideos: string[] = ['red.mp4'];
    imageDescriptors = new Map<string, AbstractImageDecriptor>();
    filter: (v: string)=>boolean = (v) => true;
    filterString: string = '';
    fuse: Fuse<string>;
    constructor() {
        makeObservable(this, {
            mainAssetPath: observable,
            availableVideos: observable,
            imageDescriptors: observable,
            filterString: observable,
            filter: observable,
            filteredVideos: computed,
            setMainAssetPath: action,
            setAvailableVideos: action,
            stringFilter: action,
            setDescriptorForAsset: action
        });
        this.fuse = new Fuse(this.availableVideos);
        API.requestFileConfigPrefs().then(c => {
            this.setMainAssetPath(c.mainAssetPath!);
        });
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
        this.fuse = new Fuse(newVids, {ignoreLocation: true});
        //nb what about imageDescriptors? should we clear the old ones? liable to leak, 
        //also incorrect to keep old keys around that could end up colliding with the new ones
        //but also nice to keep the cache, and in any case we want to change things up a bit
        //in terms of having more than one asset path, supporting other types of image...
    }
    get filteredVideos() {
        if (this.filterString.length === 0) return this.availableVideos;
        const list = this.fuse.search(this.filterString);
        console.log(`${list.length} filteredVideos`);
        return list.map(r => r.item);
    }
    stringFilter(val: string) {
        console.log(`[medialib] filterString: ${val}`);
        this.filterString = val;
    }
    chooseRandom() {
        const i = Math.floor(Math.random()*this.filteredVideos.length);
        return this.filteredVideos[i];
    }
}

const notNice = `${httpURL}/video/`.length;
export const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
export const shortName = (v: string) => decodeURI(v.substring(v.lastIndexOf('/')+1));

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