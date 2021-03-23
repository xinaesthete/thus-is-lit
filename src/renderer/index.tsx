//Make this able to have (multiple) views embedded in gui... soon.


import vs from './shaders/kaleid_vert.glsl'
import fs from './shaders/kaleid_frag.glsl'

import * as THREE from 'three'
import * as params from './params'
import * as vid from './video_state'
import {Uniforms} from '@common/tweakables'
import { onMessage, reportError, reportTime } from './renderer_comms'
import { ImageType } from '@common/media_model'

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 10);

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
    {name: "Angle2", value: 0, min: -1, max: 1},
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

const geo = new THREE.PlaneGeometry(1, 1);
const mat = new THREE.ShaderMaterial({vertexShader: vs, fragmentShader: fs, uniforms: uniforms, 
  transparent: true, depthTest: false, depthWrite: false});
// I want to set up a listener for when fragmentShader source changes. 
onMessage('fragCode', (json) => {
  console.log(`shader code changed...`);
  mat.userData.oldFrag = mat.fragmentShader;
  mat.fragmentShader = json.code;
  mat.needsUpdate = true;
});

const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

//for final presentation of feedback...
const plainMat = new THREE.MeshBasicMaterial();
const plainMesh = new THREE.Mesh(geo, plainMat);
const plainScene = new THREE.Scene();
plainMesh.position.x = 0.5;
plainMesh.position.y = 0.5;
plainScene.add(plainMesh);

let t0 = Date.now();
function animate(time: number) {
  requestAnimationFrame(animate);
  /// How necessary are ScreenAspect & UVLimit?
  if (vid.pendingVideoSwitch) return;
  let w = window.innerWidth, h = window.innerHeight;
  uniforms.ScreenAspect.value = w/h;
  const im = vid.imageState;
  const vw = im.width;
  const vh = im.height;
  
  const imageAspect = (im.rotation == -90 || im.rotation == 90) ? vh/vw : vw/vh;
  uniforms.ImageAspect.value = imageAspect;
  //TODO expose a property for "fit"
  vid.fitTexture(vid.activeTexture, w/h, imageAspect, "fit", im.rotation);
  vid.activeTexture.updateMatrix();
  uniforms.UVLimit.value = vid.activeTexture.repeat;
  
  reportTime();

  const dt = time - t0;
  t0 = time;
  parms.update(dt);
  if (im.imgType === ImageType.FeedBack) {
    const rt = renderer.getRenderTarget();
    vid.swapFeedbackBuffers(renderer);
    plainMat.map = vid.activeTexture; //stupid, but grabbing this ref before swap for presenting later
    renderer.render(scene, camera);
    renderer.setRenderTarget(rt);
    renderer.render(plainScene, camera);
  } else {
    renderer.render(scene, camera);
  }
  if (mat.userData.oldFrag) {
    console.log(`checking that new shader code was ok...`);
    renderer.info.programs?.forEach(p => {
      const diagnostics = (p as any).diagnostics;
      console.log(`found the program... runnable? ${diagnostics.runnable}`);
      /* //from WebGLProgram.js:
      this.diagnostics = {
        runnable: runnable,
        programLog: programLog,
        vertexShader: {
          log: vertexLog,
          prefix: prefixVertex
        },
        fragmentShader: {
          log: fragmentLog,
          prefix: prefixFragment
        }
      };
      */
      if (!diagnostics.runnable) {
        mat.fragmentShader = mat.userData.oldFrag;
        mat.needsUpdate = true;
        //report back to server, so that it can be viewed e.g. in 'debug' tab
        reportError(diagnostics.fragmentShader.log as string);
      }
    });
    
    mat.userData.oldFrag = undefined;
  }
}
animate(t0);
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    //camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
};

