import React from 'react';
import SpeedDial, { SpeedDialProps } from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import { observer } from 'mobx-react';
import { Numeric, Tweakable } from '@common/tweakables';
import { useKaleid } from '@gui/kaleid_context';
import { action } from 'mobx';
import { sendParameterValue } from '@gui/gui_comms';
import { Slider } from '@material-ui/core';

export default observer((u: Tweakable<Numeric>) => {
  //maybe if things like this were inside a 'speed dial'?
  //--- movementSpeedOffset ok, but really other kinds of movement are what I want. ---
  // not totally sure how I want to make this GUI, nor how I want to represent animation at the other end...
  const {movementSpeedOffset, name=''} = u;
  const k = useKaleid();
  if (movementSpeedOffset === undefined) return <></>
  // return <Donut
  //     value={movementSpeedOffset} min={-60} max={60} step={1} diameter={15} 
  //     onValueChange={action((v)=>{
  //         //u.movementSpeedOffset = t;
  //         const t = k.model.tweakables.find(t => t.name === u.name);
  //         if (t) {
  //             t.movementSpeedOffset = v;
  //             sendParameterValue(t, k.model.id);
  //         }
  //         })}
  // />
  return <Slider name={name + 'lag'} min={-60} max={60} value={movementSpeedOffset} step={1} onChange={action((ev, v) => {
      if (typeof v !== 'number') return;
      // u.movementSpeedOffset = v;
      const t = k.model.tweakables.find(t => t.name === u.name);
      if (t) {
          t.movementSpeedOffset = v;
          sendParameterValue(t, k.model.id);
      }
  })} />
});
