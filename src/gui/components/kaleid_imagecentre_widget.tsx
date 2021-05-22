import { DomAttributes } from '@common/threact/threact';
import { vec2 } from '@common/tweakables';
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
      //figure out coordinate of ev (normalised 0..1) & apply it to u...
      //looks as though currentTarget.width/height are not what I want...
      const rect = ev.currentTarget.getBoundingClientRect();
      /// note: parameter range is -1..1, but that's effectively to allow ~wrapping?
      /// still not as coherent as it could be.
      // const x = 2 * (ev.clientX-rect.left) / ev.currentTarget.offsetWidth - 1;
      // const y = -2 * (ev.clientY-rect.top) / ev.currentTarget.offsetHeight + 1;
      const x = (ev.clientX-rect.left) / ev.currentTarget.offsetWidth;
      const y = 1 - (ev.clientY-rect.top) / ev.currentTarget.offsetHeight;
      u.onChange({x, y});
    }),
    style: {
      width: '600px', height: '340px', border: '2px solid #555'
    }
  };
  return (
  <>
  <KaleidComponent previs={true} name="image centre widget" 
  {...dom}
  onMouseDown={()=>{
    setMouseDown(true);
  }} onMouseUp={() => {
    setMouseDown(false); //TODO: handle mouseUp not on component.
  }} 
  onMouseMove={(ev)=>{
    if (mouseDown) dom.onClick!(ev);
  }}
  />
  </>
  )
});
