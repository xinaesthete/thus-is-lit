import React from 'react';
import Knob from '@gui/components/rc_knob_clone/knob';
import { SliderProp } from '../uniforms_gui';
import { observer } from 'mobx-react';
import { Numeric } from '@common/tweakables';
import { makeAutoObservable } from 'mobx';

const s: SliderProp<number> = makeAutoObservable({
  name: 'test',
  modelId: 0,
  value: 0.5,
  onChange: (v) => {
    s.value = v;
  }
});

export default observer(() => {
  

  return (
    <Knob parm={s as SliderProp<Numeric>} radius={15} arcWidth={6} center={50} />
  )
})