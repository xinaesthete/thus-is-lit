import { useKaleid } from '@gui/kaleid_context';
import { observer } from 'mobx-react';
import UniformGUI from './uniforms_gui';
import React from 'react';
import fs from './shaders/kaleid_gui.frag.glsl';
import { IThree } from "@common/threact/threact";
import { WebGLRenderer } from 'three';

// use same uniforms as regular kaleid... actually, let's use the same renderer,
// but with a flag that lets it add a "#define PREVIS".
//class KaleidPrevis implements IThree {...}


export default observer(() => {
  const kaleid = useKaleid();
  //maybe it's about time to have a more visual & kaleid-specific GUI.
  //display uniform gui for bits that I don't control explicitly
  //choose ImageCentre on a video thing with a visualisation of triangle.
  
  return (
    <>
      <UniformGUI />
    </>
  )
});