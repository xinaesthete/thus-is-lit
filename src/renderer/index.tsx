import * as THREE from 'three'
import KaleidRenderer from './kaleid_renderer'
import VideoState from './video_state'
import {init as commsInit} from './renderer_comms'

const params = new URLSearchParams(location.search);
const vidUrl = params.has('vidUrl') ? params.get('vidUrl')! : 'red.mp4';

const vid = new VideoState(vidUrl);
const KRenderer = new KaleidRenderer(vid);
vid.vidEl.onplay = () => {
  console.log(`onplay`);
}
vid.vidEl.oncanplay = () => {
  console.log(`can play`);
  vid.vidEl.play();
}
// setTimeout(async ()=>{
//   vid.setImageState(vid.imageState);
// }, 3000);
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);
KRenderer.initThree(renderer.domElement);
commsInit(KRenderer);
function animate(time: number) {
  requestAnimationFrame(animate);
  KRenderer.update(time);
  KRenderer.render(renderer);
}
animate(Date.now());
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    //camera.aspect = window.innerWidth / window.innerHeight;
    KRenderer.resize(renderer.domElement.getBoundingClientRect());
};
export default "exporting from /src/renderer/index so that src/gui/renderIndexShim has something to import...";