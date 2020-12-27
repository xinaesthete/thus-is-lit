import * as THREE from 'three'
import { AbstractImageDecriptor, ImageFileDescriptor, ImageType, VideoDescriptor } from '../common/media_model';

export const vidEl = document.getElementById("vid1") as HTMLVideoElement;
let vidUrl = "red.mp4";
console.log(vidUrl);
vidEl.src = vidUrl;
// vidEl.onchange //this is the type of thing I should be using...
let __uniforms: any;
// setTimeout(() => vidEl.play(), 3000);
export const vidTex: THREE.Texture = new THREE.VideoTexture(vidEl);
export let activeTexture: THREE.Texture = vidTex;

//nb this isn't what we want the interface to look like anyway...
//(we want to be able to ideally have several copies on a page, other differences...)
//This is a stop-gap interface, I'm setting vidEl.src in renderer_comms...
export function getVideoURL() {
    return vidUrl;
}
export function setVideoURL(url: string) {
    if (url === vidUrl) return;
    if (url === 'red.mp4' && vidEl.currentSrc.endsWith('red.mp4')) return;
    vidEl.src = url;
    vidUrl = url;
    vidEl.play();
}

//XXX noooo...
let imageState: AbstractImageDecriptor = {imgType: ImageType.VideoFile, 
    width: 1920, height: 1080, duration: 999, muted: true, volume: 1,
    url: vidUrl} as VideoDescriptor; //not the way we do it...
function setVideoState(state: VideoDescriptor) {
    console.log(`setVideoState: ${JSON.stringify(state, null, 2)}`);
    vidEl.onchange = () => {
        activeTexture = vidTex;
        imageState = {
            imgType: ImageType.VideoFile,
            url: vidUrl,
            duration: vidEl.duration,
            muted: vidEl.muted,
            volume: vidEl.volume,
            width: vidEl.videoWidth,
            height: vidEl.videoHeight,
        } as VideoDescriptor; //using object literal and "as" is bad.
    }
    setVideoURL(state.url);
    vidEl.muted = state.muted;
    vidEl.volume = state.volume;
    // ?? there is a metadata field for portrait that at least some browsers understand, but can we interpret it here?
    //    or perhaps we need to try to do something in the server?  Will that be more reliable anyway?
    // vidEl.rotation
}
function getVideoState() : VideoDescriptor {
    return {
        imgType: ImageType.VideoFile,
        url: vidUrl,
        duration: vidEl.duration,
        muted: vidEl.muted,
        volume: vidEl.volume,
        width: vidEl.videoWidth,
        height: vidEl.videoHeight
    }
}
let imgUrl = '';
export function setImageState(state: AbstractImageDecriptor) {
    if (state.imgType === ImageType.VideoFile) {
        setVideoState(state as VideoDescriptor);
        imgUrl = '';
    } else {
        //assume it's a still for now...
        const img = state as ImageFileDescriptor;
        imageState = state;
        if (imgUrl !== img.url) imgUrl = img.url;
        console.log(`loading ${img.url}`);

        new THREE.TextureLoader().load(img.url, (t)=>{
            console.log(`loaded ${img.url}`);
            setTextureParams(t);
            __uniforms.texture1.value = t;
            activeTexture = t;
            imageState.width = img.width;
            imageState.height = img.height;
        });
    }
}


export async function getImageState() : Promise<AbstractImageDecriptor> {
    if (imageState.imgType == ImageType.Null) {
        //we're not ready yet. I'm sure we should be observing, definitely not doing this...
        //procrastination...
        //I do see dimensions, but imgType = 0.
        async function sleep(ms: number) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        }
        const promise: Promise<AbstractImageDecriptor> = new Promise(async (resolve, reject) => {
            while (imageState.imgType == ImageType.Null) {
                await sleep(100);
            }
            imageState.height = vidEl.videoHeight;
            imageState.width = vidEl.videoWidth;
            return imageState;
        });
        return promise;
    } else {
        return imageState;
    }
}

/** make sure texture settings are not going to force it to be scaled down to POT size before it gets used. */
function setTextureParams(t: THREE.Texture) {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = t.magFilter = THREE.LinearFilter;
}

setTextureParams(vidTex);

//https://gist.github.com/bartwttewaall/5a1168d04a07d52eaf0571f7990191c2
/**
* @param {Texture} texture - a texture - might be a video which has width/height determined differently to image
* @param {number} imageAspect - aspect ratio (width / height) of the texture.
* @param {number} screenAspect - the aspect ratio (width / height) of the model that contains the texture
* @param {"fit"|"fill"|"stretch"} mode - three modes of manipulating the texture offset and scale
* @param {number} [alignH] - optional multiplier to align the texture horizontally - 0: left, 0.5: center, 1: right
* @param {number} [alignV] - optional multiplier to align the texture vertically - 0: bottom, 0.5: middle, 1: top
**/
export function fitTexture(texture: THREE.Texture, 
    screenAspect: number, imageAspect: number, mode: "fit"|"fill"|"stretch", alignH = 0.5, alignV = 0.5) {
    //const imageAspect = texture.image.width / texture.image.height;

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
export function setup(renderer: THREE.Renderer, uniforms: any) {
    __uniforms = uniforms;
    renderer.domElement.ondragover = e => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    renderer.domElement.ondrop = e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.items) {
            const item = e.dataTransfer.items[0];
            if (item.kind === 'file') {
                const t = Date.now();
                const file = item.getAsFile()!;
                const reader = new FileReader();
                //seems like this will attempt to read entire file, blocking, before continuing...
                //---> could we politely ask the server to serve this file?
                //     I think I'm maybe not going to do that in case it complicates how I think about
                //     security model, serialization...? but maybe it's not a problem and I should just do it.
                reader.readAsDataURL(file);
                console.log(`readAsDataURL took ${Date.now() - t}`);
                reader.onload = readEvent => {
                    console.log(`onload took ${Date.now() - t}`);
                    if (!readEvent.target) return;
                    const result = readEvent.target.result as string;
                    if (file.type.startsWith('video/')) {
                        vidEl.src = result;
                        vidEl.onloadeddata = () => {
                            console.log(`onloadeddata took ${Date.now() - t}`);
                            vidEl.play();
                        }
                    } else if (file.type.startsWith('image/')) {
                        const t = uniforms.texture1.value = new THREE.TextureLoader().load(readEvent.target.result as string);
                        setTextureParams(t);
                    }
                };
            }
        }
    };
}
