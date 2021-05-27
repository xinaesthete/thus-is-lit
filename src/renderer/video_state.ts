import * as THREE from 'three'
import { AbstractImageDecriptor, FeedbackDescriptor, ImageFileDescriptor, 
    ImageType, ImRot, VideoDescriptor, VideoStreamDescriptor 
} from '@common/media_model';
import { action } from 'mobx';
export type TexChangeListener = (newTex: THREE.Texture) => void;
export default class VideoState {
    imageState: AbstractImageDecriptor;
    vidEl: HTMLVideoElement;
    _vidUrl: string;
    vidTex: THREE.Texture;
    activeTexture: THREE.Texture;
    feedbackBuffers: THREE.WebGLRenderTarget[] = [];
    streamDeviceId?: string;
    private changeListeners: TexChangeListener[] = [];
    constructor(initUrl = 'red.mp4') {
        this._vidUrl = initUrl;
        //XXX: I should remove vidEl when appropriate as well...
        ///// (not just in newVidElement(), but at the moment we leak into DOM)
        //maybe deal with this differently in React vs not.
        this.vidEl = document.createElement('video');
        this.vidTex = new THREE.VideoTexture(this.vidEl);
        this.activeTexture = this.vidTex;

        this.refreshVidElement();

        const s = new VideoDescriptor(this._vidUrl);
        s.width = 1920;
        s.height = 1080;
        this.imageState = s; //satisfy TS that field is initialised
        this.setImageState(s);
        //for debugging.
        (window as any).VID = this;
    }
    /** sometimes video gets stuck or into a bad state & this is a hack to fix it.
     * Also used for initial init.
     */
    refreshVidElement() {
        console.log('newVidElement');
        const oldEl = this.vidEl;
        oldEl.remove();
        this.vidEl = document.createElement('video');
        this.vidEl.className = 'videoTexSource';
        this.vidEl.crossOrigin = "anonymous";
        // this.vidEl.style.display = 'none';
        this.vidEl.style.opacity = '0';//seems to help with freezing video on windows.
        this.vidEl.loop = true;
        this.vidEl.autoplay = true;
        this.vidEl.muted = true;
        document.body.appendChild(this.vidEl);
        this.vidEl.src = this._vidUrl;
        this.vidEl.onloadedmetadata = action(() => {
            this.imageState.width = this.vidEl.videoWidth;
            this.imageState.height = this.vidEl.videoHeight;
        })

        //looking at the THREE.VideoTexture code, video is used in closure in constructor
        //so we definitely need a new instance to set different vidEl.
        this.vidTex = new THREE.VideoTexture(this.vidEl);
        setTextureParams(this.vidTex);
        this.activeTexture = this.vidTex; //signal to user that this has happened
        //I suppose we could mobx this instead...
        this.changeListeners.forEach((f) => f(this.vidTex));
    }
    addTextureChangeListener(callback: TexChangeListener) {
        this.changeListeners.push(callback);
        console.log('added texture change listener, now have', this.changeListeners.length);
    }
    removeTextureChangeListener(callback: TexChangeListener) {
        const i = this.changeListeners.indexOf(callback);
        if (i === -1) throw new Error('unbalanced call to removeTextureChangeListener?');
        this.changeListeners.splice(i, 1);
        console.log('removeTextureChangeListener, now have ', this.changeListeners.length);
    }
    async setImageState(state: AbstractImageDecriptor) {
        switch (state.imgType) {
            case ImageType.VideoFile:
                await this.setVideoState(state as VideoDescriptor);
                break;
            case ImageType.VideoStream:
                await this.setStreamDevice((state as VideoStreamDescriptor).deviceId);
                break;
            default:
                throw new Error('only video is implemented for now :/');
        }
    }
    async setVideoState(state: VideoDescriptor) {
        console.log('full setVideoState called', state.url);
        this.imageState = state;
        if (this.streamDeviceId) {
            this.refreshVidElement();
        }
        this.activeTexture = this.vidTex;
        const vidEl = this.vidEl;
        vidEl.muted = state.muted;
        vidEl.volume = state.volume;
        vidEl.playbackRate = state.playbackRate; //TODO gui
        if (vidEl.src !== state.url || this._vidUrl !== state.url) {
            //well worth not setting vidEl.src if we don't need to.
            this._vidUrl = vidEl.src = state.url;
        }
        if (vidEl.paused !== state.paused) {
            await state.paused ? vidEl.pause() : vidEl.play();
        }
    }
    seek(time: number) {
        const vid = this.vidEl;
        const wasPaused = vid.paused;
        if (!wasPaused) vid.pause();
        vid.currentTime = time;
        //don't start playing if not already.
        if (wasPaused) return;
        //https://stackoverflow.com/questions/10461669/seek-to-a-point-in-html5-video
        //there is evidence that this helps, other issues with other heavier imageState / setModel stuff.
        const timer = setInterval(()=> {
            if (vid.paused && vid.readyState === 4 || !vid.paused) {
                vid.play();
                clearInterval(timer);
            }
        }, 10);
    }
    get vidUrl() {
        return this._vidUrl;
    }
    /** doing this will mean that this.imageState will be a bit out of sync...
     * but it switches ASAP to a different video.
     */
    set vidUrl(url: string) {
        this._vidUrl = url;
        console.log('set vidUrl', url);
        // this.vidEl.srcObject = null; //doesn't seem enough...
        if (this.streamDeviceId) {
            this.streamDeviceId = undefined;
            this.refreshVidElement();
        }
        this.vidEl.src = url;
        this.seek(0);
    }
    async setStreamDevice(deviceId: string) {
        this.refreshVidElement();
        const vidEl = this.vidEl;
        try {
            //see https://webrtc.github.io/samples/src/content/devices/input-output/
            const stream = await navigator.mediaDevices.getUserMedia({video: {deviceId: {exact: deviceId}}});
            console.log(`setting stream id ${stream.id}, 1st video track: ${stream.getVideoTracks()[0].label}`);
            vidEl.srcObject = stream;
            this.streamDeviceId = deviceId;
            vidEl.onloadedmetadata = () => vidEl.play();
        } catch (err) {
            console.error(err);
        }
    }
    fitTexture = fitTexture;
}


/** make sure texture settings are not going to force it to be scaled down to POT size before it gets used. */
function setTextureParams(t: THREE.Texture) {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = t.magFilter = THREE.LinearFilter;
}

//https://gist.github.com/bartwttewaall/5a1168d04a07d52eaf0571f7990191c2
/**
* @param {Texture} texture - a texture - might be a video which has width/height determined differently to image
* @param {number} imageAspect - aspect ratio (width / height) of the texture.
* @param {number} screenAspect - the aspect ratio (width / height) of the model that contains the texture
* @param {"fit"|"fill"|"stretch"} mode - three modes of manipulating the texture offset and scale
* @param {ImRot} [rotation] - optional rotation by increment of 90°
* @param {number} [alignH] - optional multiplier to align the texture horizontally - 0: left, 0.5: center, 1: right
* @param {number} [alignV] - optional multiplier to align the texture vertically - 0: bottom, 0.5: middle, 1: top
**/
function fitTexture(texture: THREE.Texture, 
    screenAspect: number, imageAspect: number, mode: "fit"|"fill"|"stretch", rotation: ImRot = 0, alignH = 0.5, alignV = 0.5) {
    //const imageAspect = texture.image.width / texture.image.height;
    if (rotation == -90 || rotation == 90) {
        //imageAspect = 1 / imageAspect;
        //texture.flipY = true; //looks as though this is necessary, but doesn't seem to do anything.
    }
    texture.rotation = Math.PI * rotation/180;

    const scale = imageAspect / screenAspect;
    const offsetX = (imageAspect - screenAspect) / imageAspect;
    const offsetY = (screenAspect - imageAspect) / screenAspect;

    switch (mode) {
        // case 'contain':
        case 'fit': {
            if (screenAspect < imageAspect) { //landscape
                texture.offset.set(0, offsetY * alignV);
                texture.repeat.set(1, scale);
                // texture.rotation = 0;
            } else {
                texture.offset.set(offsetX * alignH, 0);
                texture.repeat.set(1 / scale, 1);
                // texture.rotation = Math.PI / 2;
            }
            break;
        }
        // case 'cover':
        case 'fill': {
            if (screenAspect < imageAspect) {
                texture.offset.set(offsetX * alignH, 0);
                texture.repeat.set(1 / scale, 1);
                // texture.rotation = 0;
            } else {
                texture.offset.set(0, offsetY * alignV);
                texture.repeat.set(1, scale);
                // texture.flipY = false;
                // texture.rotation = Math.PI / 2;
            }
            break;
        }
        // case 'none':
        case 'stretch':
        default: {
            texture.offset.set(0, 0);
            texture.repeat.set(1, 1);
            break;
        }
    }
}

//nb, old setup() function was for drag/drop of files onto browser window
