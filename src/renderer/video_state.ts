import * as THREE from 'three'

export const vidEl = document.getElementById("vid1") as HTMLVideoElement;
const vidUrl = "red.mp4";
console.log(vidUrl);
vidEl.src = vidUrl;
setTimeout(()=>vidEl.play(), 3000);
export const vidTex: THREE.Texture = new THREE.VideoTexture(vidEl);

/** make sure texture settings are not going to force it to be scaled down to POT size before it gets used. */
function setTextureParams(t: THREE.Texture) {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = t.magFilter = THREE.LinearFilter;
}

setTextureParams(vidTex);

export function setup(renderer: THREE.Renderer, uniforms: any) {
    renderer.domElement.ondragover = e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };
    renderer.domElement.ondrop = e => {
        e.preventDefault();
        if (e.dataTransfer.items) {
            const item = e.dataTransfer.items[0];
            if (item.kind === 'file') {
                const t = Date.now();
                const file = item.getAsFile();
                const reader = new FileReader();
                //seems like this will attempt to read entire file, blocking, before continuing...
                reader.readAsDataURL(file);
                console.log(`readAsDataURL took ${Date.now() - t}`);
                reader.onload = readEvent => {
                    console.log(`onload took ${Date.now() - t}`);
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
