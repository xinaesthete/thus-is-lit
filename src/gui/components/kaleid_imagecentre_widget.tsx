import { vec2 } from '@common/tweakables';
import { useKaleid } from '@gui/kaleid_context';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import KaleidComponent from './kaleid_component';
import { SliderProp } from './uniforms_gui';

export default observer((u: SliderProp<vec2>) => {
  const kaleid = useKaleid();
  const [cX, setX] = React.useState(0);
  const [cY, setY] = React.useState(0);
  //need to get some mouse events on this thing.
  //might be useful to overlay another div that can also be used for debugging
  return (
  <>
  <KaleidComponent previs={true} onClick={action((ev) => {
    ev.preventDefault();
    //figure out coordinate of ev (normalised -1..1) & apply it to u...
    //looks as though currentTarget.width/height are not what I want...
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = 2 * (ev.clientX-rect.left) / ev.currentTarget.offsetWidth - 1;
    const y = -2 * (ev.clientY-rect.top) / ev.currentTarget.offsetHeight + 1;
    console.log('click', x, y);
    setX(ev.clientX-rect.left);
    setY(ev.clientY-rect.top);
    u.onChange({x, y});
  })} />
  {/* {u.value.x}, {u.value.y}<br />
  {cX}, {cY} */}
  </>
  )
});
