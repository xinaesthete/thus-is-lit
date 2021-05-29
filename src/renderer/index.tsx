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

//add an overlay element with Pete's intro loop & opacity set to 1-OutputMult?
//const introOverlay = document.createElement('video');



// lock FPS to avoid LED strobing on camera @ Barbican
//// actually, setting display to 1080i 50hz should mean that I prefer to let the OS / display driver set FPS
let fpsInterval: number;
let lastDrawTime: number;
function startAnimating(fps = 25) {
  fpsInterval = 1000 / fps;
  lastDrawTime = performance.now();
  animate(lastDrawTime);
}
function animate(time: number) {
  requestAnimationFrame(animate);
  const elapsed = time - lastDrawTime;
  if (elapsed > fpsInterval) {
    lastDrawTime = time - (elapsed % fpsInterval);
    kRenderer.update(time);
    // introOverlay.style.opacity = (1. - kRenderer.outputMix).toString();
    kRenderer.render(renderer);
  }
}
startAnimating(250); //don't drop any frames


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
  recordAndDownload(renderer.domElement, 1000 * 60 * 3);
});
export default "exporting from /src/renderer/index so that src/gui/renderIndexShim has something to import...";