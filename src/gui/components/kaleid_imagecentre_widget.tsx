import { vec2 } from '@common/tweakables';
import { useKaleid } from '@gui/kaleid_context';
import { observer } from 'mobx-react';
import React from 'react';
import KaleidComponent from './kaleid_component';
import { SliderProp } from './uniforms_gui';

export default observer((u: SliderProp<vec2>) => {
  const kaleid = useKaleid();
  //need to get some mouse events on this thing.
  //might be useful to overlay another div that can also be used for debugging
  return <KaleidComponent previs={true} />
});