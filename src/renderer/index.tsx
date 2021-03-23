import * as THREE from 'three'
import KaleidRenderer from './kaleid_renderer'

const KRenderer = new KaleidRenderer();
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);
KRenderer.initThree(renderer.domElement);

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
