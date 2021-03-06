// @ts-nocheck
/** map cursor keyCodes to +ve / -ve */
const DIRECTIONS = {
  37: -1,
  38: 1,
  39: 1,
  40: -1,
};

export const onMouseMoveStart = dispatch => e => {
  e.preventDefault(); //missing in original, seems like a bug.
  return dispatch({ ...e, type: 'START' });
};

export const onKeyDown = dispatch => e => {
  const direction = DIRECTIONS[e.keyCode]
  if (!direction) {
    return;
  } else {
    e.preventDefault()
    dispatch({
      type: 'STEPS',
      direction,
    });
  }
};
export const onScroll = dispatch => e => {
  const direction = e.deltaX < 0 || e.deltaY > 0 ? 1 : e.deltaX > 0 || e.deltaY < 0 ? -1 : 0;

  //"Unable to preventDefault inside passive event listener invocation."
  // e.preventDefault();
  dispatch({
    type: 'STEPS',
    direction,
  })
}

const addEventToBody = (name, fn) => document.body.addEventListener(name, fn);
const removeEventFromBody = (name, fn) => {
  document.body.removeEventListener(name, fn)
};
export const handleEventListener = ({ dispatch, isActive }) => () => {
  const onMove = (e: any) => {
    e.preventDefault(); //is this working? seems inconsistent.
    const {pageX, pageY} = e;
    return dispatch({ pageX, pageY, type: 'MOVE' })
  }
  const onStop = () => dispatch({ type: 'STOP' })
  if (isActive) {
    addEventToBody('mousemove', onMove)
    addEventToBody('mouseup', onStop)
    return () => {
      removeEventFromBody('mousemove', onMove)
      removeEventFromBody('mouseup', onStop)
    }
  }
};
