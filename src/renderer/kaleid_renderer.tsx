import { IThreact, IThree, Threact } from "@common/threact/threact";
import vs from './shaders/kaleid_vert.glsl'
import fs from './shaders/kaleid_frag.glsl'

import * as THREE from 'three'
import * as params from './params'
import * as vid from './video_state'
import {Uniforms} from '@common/tweakables'
import { onMessage, reportError, reportTime } from './renderer_comms'
import { ImageType } from '@common/media_model'
import React from "react";

const Vector2 = THREE.Vector2;

//Note to self: adding 'threact?' comments where I need to consider design.

export default class KaleidRenderer implements IThree {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 10);
  parms: params.ParamGroup;
  uniforms: Uniforms;
  constructor() {
    let w = window.innerWidth, h = window.innerHeight; //threact?

    this.uniforms = {
      'ScreenAspect': {value: w/h},
      'ImageAspect': {value: 1920/1080},
      'UVLimit': {value: new Vector2(1920/2048, 1080/2048)},// vidTex.repeat},
      'texture1': {value: vid.vidTex},
      'textureMatrix1': {value: vid.vidTex.matrix},
    };
    this.parms = params.makeGUI([ //threact?
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
    ], this.uniforms);

    //NOTE: more than one renderer should be able to use the same vid source.
    //don't need to fix that for initial translation of code.
    //vid.setup(renderer, uniforms) --- only used for drag/drop interface.
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.ShaderMaterial({vertexShader: vs, fragmentShader: fs, uniforms: this.uniforms, 
      transparent: true, depthTest: false, depthWrite: false});
    // I want to set up a listener for when fragmentShader source changes. 
    onMessage('fragCode', (json) => { //threact
      console.log(`shader code changed...`);
      mat.userData.oldFrag = mat.fragmentShader;
      mat.fragmentShader = json.code;
      mat.needsUpdate = true;
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
  }
  
  initThree(dom: HTMLElement) {
    //doing this stuff in constructor, pending review of Threact design.
  }
  t0 = Date.now();
  update(time: number) {
    if (vid.pendingVideoSwitch) return;
    let w = window.innerWidth, h = window.innerHeight;
    this.uniforms.ScreenAspect.value = w/h;
    const im = vid.imageState; //threact...
    const vw = im.width;
    const vh = im.height;
    
    const imageAspect = (im.rotation == -90 || im.rotation == 90) ? vh/vw : vw/vh;
    this.uniforms.ImageAspect.value = imageAspect;
    //TODO expose a property for "fit"
    vid.fitTexture(vid.activeTexture, w/h, imageAspect, "fit", im.rotation);
    vid.activeTexture.updateMatrix();
    this.uniforms.UVLimit.value = vid.activeTexture.repeat;
    
    reportTime(); //threact...
  
    const dt = time - this.t0;
    this.t0 = time;
    this.parms.update(dt);
  }
  render(renderer: THREE.WebGLRenderer) {
    const im = vid.imageState;
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
    let w = window.innerWidth, h = window.innerHeight;
    this.uniforms.ScreenAspect.value = w/h;
    //XXX: camera...
  }
  disposeThree() {}
}
