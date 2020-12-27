import { observable, makeObservable } from 'mobx'
import { getVideoList } from './medialib';

class MediaLibrary {
    @observable mainAssetFolder: string = "";
    @observable availableVideos: string[] = []
    
    constructor() {
        makeObservable(this);
        getVideoList(true).then()
    }
}


// import { types } from 'mobx-state-tree'
// not today, hold it off...
// export const RootGuiStore = types.model({})
