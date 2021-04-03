import * as THREE from 'three'
import KaleidRenderer from './kaleid_renderer'
import VideoState from './video_state'
import {init as commsInit} from './renderer_comms'

const vid = new VideoState();
const KRenderer = new KaleidRenderer(vid);
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
