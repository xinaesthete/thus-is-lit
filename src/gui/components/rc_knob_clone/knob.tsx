//import { Tweakable } from '@common/tweakables';
import React from 'react';
import theme from '@gui/theme';
import { KnobArcProps, KnobProps } from './knobTypes';
import useUpdate from './useUpdate';
import { getPercentageFromValue } from './utils';
import { SliderProp } from '../uniforms_gui';

///BORROWING HEAVILY FROM https://github.com/eskimoblood/rc-knob/blob/master/src/Arc.js


const pointOnCircle = (center: number, radius: number, angle: number) => ({
  x: center + radius * Math.cos(angle),
  y: center + radius * Math.sin(angle),
})
const degTorad = (deg: number) => (Math.PI * deg) / 180
const calcPath = ({
  //TODO: sort out type logic size vs radius etc.
  percentage = 0.75,
  angleOffset = 0,
  angleRange = 360,
  arcWidth = 4,
  radius: outerRadius,
  center,
}: KnobArcProps) => {
  const angle = angleRange * Math.min(percentage, 0.9999);
  const startAngle = angleOffset - 90
  const innerRadius = outerRadius - arcWidth
  const startAngleDegree = degTorad(startAngle)
  const endAngleDegree = degTorad(startAngle + angle)
  const largeArcFlag = angle < 180 ? 0 : 1

  const p1 = pointOnCircle(center, outerRadius, endAngleDegree)
  const p2 = pointOnCircle(center, outerRadius, startAngleDegree)
  const p3 = pointOnCircle(center, innerRadius, startAngleDegree)
  const p4 = pointOnCircle(center, innerRadius, endAngleDegree)
  //why is backaground path not appearing (size 0x6)?
  //because it degenerates when percentage = 1; changed to 0.9999.
  return `M${p1.x},${p1.y
    } A${outerRadius},${outerRadius} 0 ${largeArcFlag} 0 ${p2.x},${p2.y}L${p3.x
    },${p3.y} A${innerRadius},${innerRadius} 0 ${largeArcFlag} 1 ${p4.x},${p4.y
    } L${p1.x},${p1.y}`
}

interface ArcProps extends KnobArcProps { background: string, color: string };
const Arc = ({ background, color, ...props }: ArcProps) => {

  return (
    <g>
      {background && (
        <path
          d={calcPath({ ...props, percentage: 1 })}
          style={{ fill: background }}
        />
      )}
      <path d={calcPath(props)} style={{ fill: color }} />
    </g>
  )
}


/** Would be good to make something that would work as a reusable module outside
 * this context... but for now, we already have a type with the kinds of properties we want. 
*/
const Knob = ({ size, angleBased, ...props }: KnobProps) => { 
  //SVG element 
  //mouse behaves a bit like a slider (simpler to program & MUCH easier to use)
  //(actually not completely simpler to program - needed to add something to remember initial % val)
  //graphics a bit like arc && pointer here https://eskimoblood.github.io/rc-knob/ (Ableton-ish)
  //// actually, not going to use that, but ripping it off & making changes.
  
  const background = theme.palette.background.paper;
  const color = theme.palette.primary.main;

  const angleRange = props.wrap ? 360 : 270;
  const angleOffset = props.wrap ? 0 : 180+45;

  const { //TODO: reconcile representation of percentage, value etc.
    percentage, value, onStart, svg, container, onKeyDown, onScroll,
  } = useUpdate({
    //...parm as SliderProp<number>,
    size,
    angleBased,
    angleOffset, angleRange,
    ...props
  });
  const arcProps: KnobArcProps = {
    percentage, radius: size/2, arcWidth: 5, center: size/2, angleRange, angleOffset,
  }
  return (
    <div
      ref={container}
      style={{outline: 'none', width: size, height: size, position: 'relative', margin: 'auto'}}
      onKeyDown={onKeyDown}
      // onWheel={onScroll}
      onMouseDown={onStart}
    >
      <svg width={size} height={size} ref={svg}>
        <Arc background={background} color={color} {...arcProps} />
      </svg>
    </div>
  )
}

export default Knob;