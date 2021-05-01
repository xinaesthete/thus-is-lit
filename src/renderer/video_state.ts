import * as THREE from 'three'
import { AbstractImageDecriptor, FeedbackDescriptor, ImageFileDescriptor, 
    ImageType, ImRot, VideoDescriptor 
} from '@common/media_model';

export default class VideoState {
    imageState: AbstractImageDecriptor;
    vidEl: HTMLVideoElement;
    _vidUrl = "red.mp4";
    vidTex: THREE.Texture;
    activeTexture: THREE.Texture;
    pendingVideoSwitch = false; //did this ever help? Make new element instead?
    feedbackBuffers: THREE.WebGLRenderTarget[] = [];
    constructor() {
        //XXX: I should remove vidEl when appropriate as well...
        //maybe deal with this differently in React vs not.
        this.vidEl = document.createElement('video');
        this.vidEl.style.display = 'none';
        this.vidEl.loop = true;
        this.vidEl.autoplay = true;
        this.vidEl.muted = true;
        document.body.appendChild(this.vidEl);
        this.vidEl.src = this._vidUrl;
        this.vidTex = new THREE.VideoTexture(this.vidEl);
        setTextureParams(this.vidTex);
        this.activeTexture = this.vidTex;
        const s = new VideoDescriptor(this._vidUrl);
        s.width = 1920;
        s.height = 1080;
        this.imageState = s; //satisfy TS that field is initialised
        this.setImageState(s);
        //for debugging.
        (window as any).VID = this;
    }
    async setImageState(state: AbstractImageDecriptor) {
        switch (state.imgType) {
            case ImageType.VideoFile:
                await this.setVideoState(state as VideoDescriptor);
                break;
            default:
                throw new Error('only video is implemented for now :/');
        }
    }
    async setVideoState(state: VideoDescriptor) {
        this.imageState = state;
        // this.pendingVideoSwitch = true;
        this.activeTexture = this.vidTex;
        const vidEl = this.vidEl;
        vidEl.muted = state.muted;
        vidEl.volume = state.volume;
        this._vidUrl = vidEl.src = state.url;
        await state.paused ? vidEl.pause() : vidEl.play();
    }
    seek(time: number) {
        const vid = this.vidEl;
        vid.pause();
        vid.currentTime = time;
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
        this.vidEl.src = url;
        // this.seek(0);
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
