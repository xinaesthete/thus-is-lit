import { isNum, Numeric, vec2 } from '@common/tweakables';
import { sendParameterValue } from '@gui/gui_comms';
import { useKaleid } from '@gui/kaleid_context';
import { useStyles } from '@gui/theme';
import { GridList, GridListTile, GridListTileBar, Typography } from '@material-ui/core';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import Knob from './rc_knob_clone/knob';
import { defaultStep, SliderProp } from './uniforms_gui';

const TweakableWidget = observer(({ ...props }: SliderProp<Numeric>) => {
  if (isNum(props.value)) return <TweakableKnob {...props} />
  return (
    <XYControl {...props as SliderProp<vec2>} />
  )
});

/**
 * I'd like to have fancy knobs, maybe with outer-rings for 'modulation amount' like in
 * Massive or Equator or something. Unfortunately I didn't find a good-to-go React component.
 */
const TweakableKnob = observer(function _TweakableSlider(u: SliderProp<Numeric>) {
  if (!isNum(u.value)) return <XYControl {...(u as SliderProp<vec2>)} />;


  useEffect(() => {
    ///
  })
  const onChange = (v: number) => {
  }
  const angleBased = false;
  return (
    <>
      <Knob {...u as SliderProp<number>} size={40} angleBased={angleBased} sensitivity={0.3} />
      <Typography variant="caption">{u.name}</Typography>
    </>
  )
});

const XYControl = observer((u: SliderProp<vec2>) => {
  return (
    <></>
  )
})

const KnobPanel = observer(() => {
  const kaleidContext = useKaleid();
  return (
    <div className='knob_group_panel'>
      {kaleidContext.model.tweakables.map((u, i) => {
        return (
          <div key={u.name!} className='knob_box'>
            <TweakableWidget {...u} modelId={kaleidContext.model.id}
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
          </div>
        )
      })}
    </div>
  )
});

export default KnobPanel;