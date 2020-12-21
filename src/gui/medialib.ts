import * as API from "./gui_comms";

let videoList: string[] = [];

export async function getListVideos(forceRefresh = false) {
    if (!forceRefresh && videoList.length > 0)
        return videoList;
    //cache this list and return when asked.
    videoList = await API.requestListVideos();
    console.log(`got new video list: ${videoList}`);
    return videoList;
}

export async function setMainAssetPath(path: string) {
    const ok = await API.requestSetMainAssetPath(path);
    if (ok) {
        getListVideos(true);
    }
    return ok;
}

export async function getFileConfigPrefs() {
    return await API.requestFileConfigPrefs();
}
