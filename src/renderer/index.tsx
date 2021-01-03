//// change this so that it is able to respond to messages
//also want to make it able to have (multiple) views embedded in gui... soon.


import vs from './shaders/kaleid_vert.glsl'
import fs from './shaders/kaleid_frag.glsl'

import * as THREE from 'three'
import * as params from './params'
import * as vid from './video_state'
import {Uniforms} from '../common/tweakables'
import { onMessage, reportTime } from './renderer_comms'

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 10);
camera.position.set(0.5, 0.5, -1);
camera.lookAt(0.5,0.5,0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);


let w = window.innerWidth, h = window.innerHeight;

const Vector2 = THREE.Vector2;
const uniforms: Uniforms = {
    'ScreenAspect': {value: w/h},
    'ImageAspect': {value: 1920/1080},
    'Leaves': {value: 3},
    'Angle': {value: 1.05},
    'OutAngle': {value: 0},
    'Zoom': {value: 1.3},
    'MozMix': {value: 1.},
    'Centre': {value: new Vector2(0.5, 0.5)},
    'ImageCentre': {value: new Vector2(0.5, 0.)},
    'UVLimit': {value: new Vector2(1920/2048, 1080/2048)},// vidTex.repeat},
    'texture1': {value: vid.vidTex},
    'textureMatrix1': {value: vid.vidTex.matrix},
};

//this will also (for the time being) be responsible for reporting that we've started to the server.
///--> mobx -->
const parms = params.makeGUI([
    {name: "LagTime", value: -10, min: -180, max: 20}, //"midi pitch" log scale.
    {name: "Leaves", value: 3, min: 1, max: 8, step: 1},
    {name: "Angle", value: 1.05, min: -Math.PI, max: Math.PI},
    {name: "AngleGain", value: 0.5, min: 0, max: 1},
    {name: "OutAngle", value: 0, min: -1, max: 1},
    {name: "Zoom", value: 1.3, min: 0, max: 10},
    {name: "KaleidMix", value: 0.999, min: 0, max: 1, step: 1},
    {name: "Mozaic", value: 4, min: 1, max: 40}, //log scale...
    {name: "MozGain", value: .5, min: 0, max: 1},
    {name: "ContrastPreBias", value: 0.5, min: 0, max: 1},
    {name: "ContrastGain", value: 0.5, min: 0, max: 1},
    {name: "ContrastPostBias", value: 0.5, min: 0, max: 1},
    {name: "SaturationBias", value: 0.5, min: 0, max: 1},
    {name: "SaturationGain", value: 0.5, min: 0, max: 1},
    {name: "ImageCentre", value: new Vector2(0.5, 0), min: -1, max: 1},
    {name: "Centre", value: new Vector2(0., 0.), min: -1, max: 1},
    {name: "Vignette", value: new Vector2(0.1, 0.1), min: 0, max: 0.2},
], uniforms);

vid.setup(renderer, uniforms);

const geo = new THREE.PlaneGeometry(2, 2);
const mat = new THREE.ShaderMaterial({vertexShader: vs, fragmentShader: fs, uniforms: uniforms, transparent: true});
// I want to set up a listener for when fragmentShader source changes. 
onMessage('fragCode', (json) => {
  console.log(`shader code changed...`);
  mat.fragmentShader = json.code;
  mat.needsUpdate = true;
});

const mesh = new THREE.Mesh(geo, mat);
mesh.position.x = 0.5;
mesh.position.y = 0.5;

//mesh.position.z = 0.5;
//mesh.updateMatrix();
scene.add(mesh);
let t0 = Date.now();
function animate(time: number) { //nb this SHOULD ABSOLUTELY NOT be async but it's convenient for a quick hack.
  requestAnimationFrame(animate);
  //uniforms.iTime.value = Date.now() / 1000;
  
  /// How necessary are ScreenAspect & UVLimit?
  if (vid.pendingVideoSwitch) return;
  let w = window.innerWidth, h = window.innerHeight;
  uniforms.ScreenAspect.value = w/h;
  const im = vid.imageState;
  //but it will only take time when things are still being set up.
  //const img = uniforms.texture1.value;
  const vw = im.width;
  const vh = im.height;
  uniforms.ImageAspect.value = vw/vh;
  const longSide = Math.max(vw, vh);
  // UVLimit is a vec2 because it traces its origins to portion of POT texture
  // { x/NPOT(x), y/NPOT(y) }
  // -- the way we're using longSide is probably responsible for a lot that's wrong just now --
  // -- but actually the UVs should be normalised to the whole image anyway,
  // so (I hypothesise) that where it's used for mirrorRepeat could be replaced with a simpler version
  // uniforms.UVLimit.value = {x: vw/longSide, y: vh/longSide};
  
  //TODO expose a property for "fit"
  vid.fitTexture(vid.activeTexture, w/h, vw/vh, "fit");
  //I have a problem with debugger in electron... 
  //I could try to fix that, or just implement that part of server and use browser.
  //how about switching these values based on whether screen or image aspect are portrait?
  //also it seems to me that we still need to rotate(?) portrait images sometimes(?!) (see fitTexture)
  
  vid.activeTexture.updateMatrix();
  uniforms.UVLimit.value = vid.activeTexture.repeat; //this is similar to how it was set before (maybe not the assignment), 
  //but I realised repeat was always {1, 1}, (maybe it was ok with stills).
  
  
  
  reportTime();

  const dt = time - t0;
  t0 = time;
  parms.update(dt);
  renderer.render(scene, camera);
}
animate(t0);
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    //camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
};

