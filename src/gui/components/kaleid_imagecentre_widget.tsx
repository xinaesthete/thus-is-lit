import { DomAttributes } from '@common/threact/threact';
import { vec2 } from '@common/tweakables';
import { useKaleid } from '@gui/kaleid_context';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import KaleidComponent from './kaleid_component';
import { SliderProp } from './uniforms_gui';

export default observer((u: SliderProp<vec2>) => {
  //might be useful to overlay another div that can also be used for debugging

  const [mouseDown, setMouseDown] = React.useState(false);
  const dom: DomAttributes = {
    onClick: action((ev) => {
      ev.preventDefault();
      //figure out coordinate of ev (normalised -1..1) & apply it to u...
      //looks as though currentTarget.width/height are not what I want...
      const rect = ev.currentTarget.getBoundingClientRect();
      const x = 2 * (ev.clientX-rect.left) / ev.currentTarget.offsetWidth - 1;
      const y = -2 * (ev.clientY-rect.top) / ev.currentTarget.offsetHeight + 1;
      u.onChange({x, y});  
    })
  };
  return (
  <>
  <KaleidComponent previs={true} name="image centre widget"
  onClick={dom.onClick} 
  onMouseDown={(ev)=>{
    setMouseDown(true);
  }} onMouseUp={(ev) => {
    setMouseDown(false);
  }} 
  onMouseMove={(ev)=>{
    if (mouseDown) dom.onClick!(ev);
  }}
  />
  </>
  )
});
