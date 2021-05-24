import { isNum, Numeric, vec2 } from '@common/tweakables';
import { sendParameterValue } from '@gui/gui_comms';
import { useKaleid } from '@gui/kaleid_context';
import { useStyles } from '@gui/theme';
import { GridList, GridListTile, GridListTileBar } from '@material-ui/core';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import Knob from './rc_knob_clone/knob';
import { defaultStep, SliderProp } from './uniforms_gui';

const TweakableWidget = observer(({...props}: SliderProp<Numeric>) => {
  if (isNum(props.value)) return <TweakableKnob {...props} />
  return (
    <XYControl {...props as SliderProp<vec2>}/>
  )
});

/**
 * I'd like to have fancy knobs, maybe with outer-rings for 'modulation amount' like in
 * Massive or Equator or something. Unfortunately I didn't find a good-to-go React component.
 */
const TweakableKnob = observer(function _TweakableSlider(u: SliderProp<Numeric>) {
  if (!isNum(u.value)) return <XYControl {...(u as SliderProp<vec2>)} />;
  const classes = useStyles();
  const { name ='', min=0, max=1, value, step = defaultStep(u), onChange } = u as SliderProp<number>;
  
  //https://github.com/pavelkukov/react-dial-knob/issues/9
  //const val = (value % step) ? min : value; //quantize(value, min, max, step);

  const imin = 0, imax = 200, istep = 1;
  const r = max-min;
  const rStep = 200/r; //not sure this is a good name
  const rInvStep = r/200; //not sure this is a good name
  const normalise = (v: number) => {
    //output = output_start + ((output_end - output_start) / (input_end - input_start)) * (input - input_start)
    //output = 0 + ((200) / (r)) * (v - min)
    return Math.round(rStep * (v-min));
  }
  const mapBack = (v: number) => {
    //output = output_start + ((output_end - output_start) / (input_end - input_start)) * (input - input_start)
    //output = min + (r / 200) * (v - 0)
    //output = min + 1 * v
    //output = min + 1 * v
    return min + rInvStep * v;
  }
  const [val, setVal] = React.useState(normalise(value));
  
  return (
      <>
          <Knob {...u as SliderProp<number>} size={20} />
      </>
  )
});

const XYControl = observer((u: SliderProp<vec2>) => {
  return (
    <></>
  )
})

const KnobPanel = observer(()=> {
  const kaleidContext = useKaleid();
  return (
    <GridList cellHeight={300} cols={4}>
    {kaleidContext.model.tweakables.map((u, i) => {
        return (
            <GridListTile key={u.name!} cols={u.specialWidget ? 2 : 1}>
              <div style={{display: 'flex'}}>
                <TweakableWidget key={u.name} {...u} modelId={kaleidContext.model.id}
                onChange={action((v) => {
                    if (isNum(v)) u.value = v;
                    else {
                        // if u.value had a setter, we wouldn't need this branch
                        Object.assign(u.value, v);
                        // const val = u.value as vec2;
                        // val.x = v.x;
                        // val.y = v.y;
                    }
                    //no need for a mobx reaction, straightforward side-effect
                    sendParameterValue(u, kaleidContext.model.id);
                })}
                />
                <GridListTileBar title={u.name!} />
              </div>
            </GridListTile>
        )
    })}
  </GridList>
  )
});

export default KnobPanel;