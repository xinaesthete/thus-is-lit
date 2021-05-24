import { SliderProp } from "../uniforms_gui";
import { KnobInteractionPos, PercentageOfRange } from "./knobTypes";

export const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value))

export const caclulatePercentage = ({
  startX = 0,
  startY = 0,
  pageX,
  pageY,
  angleOffset = 0,
  angleRange = 0,
  angleBased = false,
  wrap = false,
  startPercentage,
  radius,
  sensitivity = 1,
}: KnobInteractionPos) => {
  const x = startX - pageX;
  const y = startY - pageY;
  if (angleBased) {
    const degree = (Math.atan2(-y, -x) * 180) / Math.PI + 90 - angleOffset;
    const angle = degree < 0 ? degree + 360 : degree % 360;

    if (angle <= angleRange) {
      return clamp(0, 1, angle / angleRange);
    } else {
      return +(angle - angleRange < (360 - angleRange) / 2);
    }
  } else {
    // we need to know what the value was at the start of the interaction (as a percentage)
    
  }
};

export const findClosest = (values: number[], value: number) => {
  let result = 0, lastDelta: number;

  values.some(item => {
    const delta = Math.abs(value - item)
    if (delta >= lastDelta) {
      return true;
    }
    result = item;
    lastDelta = delta;
  });
  return result;
};

export const getValueFromPercentage = ({ min, max, percentage }: PercentageOfRange) => {
  min + (max - min) * percentage;
};
export const getPercentageFromValue = ({ min = 0, max = 1, value }: SliderProp<number>) => {
  (value - min) / (max - min);
};

export const getStartXY = ({ container, size }: any) => ({
  startX: Math.floor(container.current.offsetLeft) + size / 2,
  startY: Math.floor(container.current.offsetTop) + size / 2,
});
