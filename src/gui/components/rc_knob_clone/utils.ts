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
  sensitivity = 0.5,
}: KnobInteractionPos) => {
  const x = startX - pageX;
  const y = startY - pageY;
  if (angleBased) {
    const degree = (Math.atan2(-y, -x) * 180) / Math.PI + 90 - angleOffset;
    const angle = degree < 0 ? degree + 360 : degree % 360;
    console.log('angle', angle);
    if (angle <= angleRange) {
      return clamp(0, 1, angle / angleRange);
    } else {
      return +(angle - angleRange < (360 - angleRange) / 2);
    }
  } else {
    // we need to know what the value was at the start of the interaction (as a percentage)
    // it'd be nice to alter sensitivity as a function of x, but then we also need to consider previous value
    const v = startPercentage + (y/radius)*sensitivity;
    return wrap ? (v+1) % 1 : clamp(0, 1, v);
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

export const getValueFromPercentage = ({ min, max, percentage }: PercentageOfRange) =>
  min + (max - min) * percentage;

export const getPercentageFromValue = ({ min = 0, max = 1, value }: SliderProp<number>) =>
  (value - min) / (max - min);


export const getStartXY = ({ container, size, percentage }: any) => {
  const rect = container.current.getBoundingClientRect() as DOMRect;
  return {
    startX: Math.floor(rect.left) + size / 2,
    startY: Math.floor(rect.top) + size / 2,
  }
};
