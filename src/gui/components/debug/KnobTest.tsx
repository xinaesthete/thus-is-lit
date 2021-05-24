import React from 'react';
import Knob from '@gui/components/rc_knob_clone/knob';
import { SliderProp } from '../uniforms_gui';
import { observer } from 'mobx-react';
import { Numeric } from '@common/tweakables';
import { makeAutoObservable } from 'mobx';

const s: SliderProp<number> = makeAutoObservable({
  name: 'test',
  modelId: 0,
  value: 0.2,
  min: 0, max: 1,
  onChange: (v) => {
    console.log('setting KnobTest', s.value, v);
    s.value = v;
  }
});

export default observer(() => {
  const [val, setVal] = React.useState(0.1);
  const onChange = (v: number) => {
    setVal(v);
    console.log(v);
  }
  return (
    <>
    <Knob 
      value={val} min={0} max={1} size={50} onChange={onChange} onValueChange={onChange} 
      modelId={-1}
    />
    <Knob {...s} size={30} onValueChange={s.onChange} />
    </>
  )
});