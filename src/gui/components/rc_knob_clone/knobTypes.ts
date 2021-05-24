import { Numeric } from "@common/tweakables";
import { SliderProp } from "../uniforms_gui";


export interface KnobArcProps {
  percentage: number,
  angleOffset: number,
  angleRange: number,
  arcWidth: number,
  radius: number,
  center: number,
}

/** yet another place where we define an interface for something with a min/max/value etc.
 * this time, it's for rc_knob_clone...
 */
export interface KnobProps extends SliderProp<number> {
  //parm: SliderProp<Numeric>;
  size: number;
  /** if true, computes value based on where the mouse is positioned around the arc of the component.
   * If false, value is computed based on relative y-coordinate (ie, drag up&down like a slider).
   */
  angleBased?: boolean;
  /** When not `angleBased`, how sensitive should the knob be? If this is 1, the range of motion to 
   * move through the entire range will be equal to `size`, if it's 0.5 the mouse has to move twice as far etc.
  */
  sensitivity?: number;
  /** nb, SliderProp already had an onChange, there is probably not much point in having both. **At the time of writing,
   * `onChange` does not get called automatically but this does**.
   */
  onValueChange?: (v: number) => void;
}

export interface KnobInteractionPos extends KnobProps, KnobArcProps {
  /** x coordinate at start of interaction? */
  startX?: number;
  startY?: number;
  /** x coordinate now */
  pageX: number;
  pageY: number;
  /** the value (as a percentage) of the knob when the interaction was started
   * such that we can compute a relative change now.
   * This was not part of original rc-knob, which always computed an absolute value 
   * based on angle.
   */
  startPercentage: number; //also, we can do something different for XY w/vec2.
  angleBased?: boolean;
  wrap?: boolean;
}

export interface PercentageOfRange {
  min: number;
  max: number;
  percentage: number;
}
