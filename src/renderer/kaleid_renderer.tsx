import { IThree } from "@common/threact/threact";
import vs from './shaders/kaleid_vert.glsl'
import fs from './shaders/kaleid_frag.glsl'

import * as THREE from 'three'
import * as params from './params'
// import * as vid from './video_state'
import VideoState from './video_state'
import {MovementType, Numeric, Uniforms} from '@common/tweakables'
import { ImageType } from '@common/media_model'
import KaleidModel from "@common/KaleidModel";

const Vector2 = THREE.Vector2;

// console.log('----- frag.glsl: -----');
// console.log(fs);
// console.log('----- frag.glsl: -----');
//const vid = new VideoState();

//Note to self: adding 'threact?' comments where I need to consider design.
const fix = MovementType.Fixed;
const defaultTweakables = [ //threact?
  {name: "LagTime", value: -10, min: -180, max: 20, tags: ['motion']}, //"midi pitch" log scale.
  {name: "Leaves", value: 3, min: 1, max: 8, step: 1, tags: ['geometry']},
  {name: "Angle", value: 1.05, min: -Math.PI, max: Math.PI, wrap: true, tags: ['geometry']},
  {name: "AngleGain", value: 0.5, min: 0, max: 1, tags: ['geometry']},
  {name: "Angle2", value: 0, min: -1, max: 1, tags: ['geometry']},
  {name: "OutAngle", value: 0, min: -1, max: 1, wrap: true, tags: ['geometry']},
  {name: "Zoom", value: 1.3, min: 0, max: 10, tags: ['geometry']},
  {name: "KaleidMix", value: 0.999, min: 0, max: 1, step: 1, movement: fix},
  {name: "Mozaic", value: 4, min: 1, max: 40, tags: ['geometry']}, //log scale...
  {name: "MozGain", value: .5, min: 0, max: 1, tags: ['geometry']},
  {name: "ContrastPreBias", value: 0.5, min: 0, max: 1, tags: ['colour']},
  {name: "ContrastGain", value: 0.5, min: 0, max: 1, tags: ['colour']},
  {name: "ContrastPostBias", value: 0.5, min: 0, max: 1, tags: ['colour']},
  {name: "SaturationBias", value: 0.5, min: 0, max: 1, tags: ['colour']},
  {name: "SaturationGain", value: 0.5, min: 0, max: 1, tags: ['colour']},
  {name: "ImageCentre", value: new Vector2(0.5, 0), min: -1, max: 1, wrap: true, tags: ['geometry']},
  {name: "Centre", value: new Vector2(0., 0.), min: -1, max: 1, tags: ['geometry']},
  {name: "Vignette", value: new Vector2(0.1, 0.1), min: 0, max: 0.2, movement: fix},
];


export default class KaleidRenderer implements IThree {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 10);
  parms: params.ParamGroup;
  uniforms: Uniforms;
  vid: VideoState;
  mat: THREE.ShaderMaterial;
  static fs: string = fs;
  constructor(vid: VideoState, model?: KaleidModel) {
    this.vid = vid;// || new VideoState();
    ////---
    let w = window.innerWidth, h = window.innerHeight; //threact? should know about container element

    this.uniforms = {
      'ScreenAspect': {value: w/h},
      'ImageAspect': {value: 1920/1080},
      'UVLimit': {value: new Vector2(1920/2048, 1080/2048)},// vidTex.repeat},
      'texture1': {value: vid.vidTex},
      'textureMatrix1': {value: vid.vidTex.matrix},
    };
    if (model) {
      this.parms = params.makeGUI(model.tweakables, this.uniforms);
    } else {
      this.parms = params.makeGUI(defaultTweakables, this.uniforms);
    }

    //NOTE: more than one renderer should be able to use the same vid source.
    //don't need to fix that for initial translation of code.
    //vid.setup(renderer, uniforms) --- only used for drag/drop interface.
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.ShaderMaterial({vertexShader: vs, fragmentShader: fs, uniforms: this.uniforms, 
      transparent: true, depthTest: false, depthWrite: false});
    this.mat = mat;
    
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
  }
  setParmsFromArray(vals: Numeric[]) {
    vals.forEach((p, index) => {
      const t = this.parms.parms[index].val; //oof
      t.lagTime = 0.01;//xxx
      t.targVal = p;
    });
  }
  initThree(dom: HTMLElement) {
    //doing most stuff in constructor, pending review of Threact design.
    this.resize(dom.getBoundingClientRect());
  }
  t0 = Date.now();
  onUpdate: ()=>void = ()=>{};
  update(time: number) {
    if (this.vid.pendingVideoSwitch) return;
    const vid = this.vid;
    const im = vid.imageState;
    const vw = im.width;
    const vh = im.height;
    
    const imageAspect = (im.rotation == -90 || im.rotation == 90) ? vh/vw : vw/vh;
    this.uniforms.ImageAspect.value = imageAspect;
    const screenAspect = this.uniforms.ScreenAspect.value as number;
    vid.fitTexture(vid.activeTexture, screenAspect, imageAspect, "fit", im.rotation);
    vid.activeTexture.updateMatrix();
    this.uniforms.UVLimit.value = vid.activeTexture.repeat;
    
    //reportTime(); //threact?...
    this.onUpdate();
  
    const dt = time - this.t0;
    this.t0 = time;
    this.parms.update(dt);
    if (this.mat.fragmentShader !== KaleidRenderer.fs) this.updateFragCode();
  }
  private updateFragCode() {
    console.log(`updating shader code`);
    const mat = this.mat;
    mat.userData.oldFrag = mat.fragmentShader;
    mat.fragmentShader = KaleidRenderer.fs;
    mat.needsUpdate = true;
    //TODO: error checking / reporting, diff?
  }
  render(renderer: THREE.WebGLRenderer) {
    const im = this.vid.imageState;
    if (im.imgType === ImageType.FeedBack) {
      // const rt = renderer.getRenderTarget();
      // vid.swapFeedbackBuffers(renderer);
      // plainMat.map = vid.activeTexture; //stupid, but grabbing this ref before swap for presenting later
      // renderer.render(scene, camera);
      // renderer.setRenderTarget(rt);
      // renderer.render(plainScene, camera);
    } else {
      renderer.render(this.scene, this.camera);
    }
  }
  resize(rect: DOMRect) {
    let w = rect.width, h = rect.height;
    // console.table([w, h]);
    this.uniforms.ScreenAspect.value = w/h;
    //XXX: camera...
  }
  disposeThree() {}
}
