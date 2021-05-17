import * as THREE from 'three'
import KaleidRenderer from './kaleid_renderer'
import VideoState from './video_state'
import {init as commsInit} from './renderer_comms'
import recordAndDownload from './recorder';
import registerKey from './renderer_keys';

const params = new URLSearchParams(location.search);
const vidUrl = params.has('vidUrl') ? params.get('vidUrl')! : 'red.mp4';

const vid = new VideoState(vidUrl);
const kRenderer = new KaleidRenderer(vid);
vid.vidEl.onplay = () => {
  //console.log(`onplay`);
}
vid.vidEl.oncanplay = () => {
  // console.log(`can play`);
  // vid.vidEl.play();
}
// setTimeout(async ()=>{
//   vid.setImageState(vid.imageState);
// }, 3000);
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);
kRenderer.initThree(renderer.domElement);
commsInit(kRenderer);
function animate(time: number) {
  requestAnimationFrame(animate);
  kRenderer.update(time);
  kRenderer.render(renderer);
}
animate(Date.now());
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    //camera.aspect = window.innerWidth / window.innerHeight;
    kRenderer.resize(renderer.domElement.getBoundingClientRect());
};
registerKey('v', () => {
  vid.refreshVidElement();
});
registerKey('r', () => {
  console.log('recording....');
  recordAndDownload(renderer.domElement, 10000);
});
export default "exporting from /src/renderer/index so that src/gui/renderIndexShim has something to import...";