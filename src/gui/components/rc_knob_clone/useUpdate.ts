// @ts-nocheck
import { useReducer, useEffect, useRef } from 'react'
import {
    caclulatePercentage,
    findClosest,
    getStartXY,
    getValueFromPercentage,
    clamp,
    getPercentageFromValue,
} from './utils'
import {
    onMouseMoveStart,
    onKeyDown,
    handleEventListener,
    onScroll,
} from './eventHandling'

// how can we preventDefault?
const onStart = state => ({
    ...state,
    isActive: true,
    ...getStartXY(state),
    startPercentage: state.percentage, //2?!
    radius: state.size/2 //pjt hack
})

const onMove = ({ state, action, onChange }) => {
    const percentage = caclulatePercentage({
        ...state,
        ...action,
    })
    let value = getValueFromPercentage({ ...state, percentage })

    onChange(value); //failing to destructure further down...
    //never gets to return because React throws an error.
    //seems I have an invalid hook call somewhere (maybe in my KnobTest).
    return {
        ...state,
        percentage,
        value,
    }
}

const onChangeByStep = ({ state, action, onChange }) => {
    const value = clamp(
        state.min,
        state.max,
        state.value + 1 * action.direction
    )
    onChange(value)
    return {
        ...state,
        value,
        percentage: getPercentageFromValue({ ...state, value }),
    }
}
const reducer = onChange => (state, action) => {
    switch (action.type) {
        case 'START':
            return onStart(state)
        case 'MOVE':
            return onMove({ state, action, onChange })
        case 'STEPS':
            return onChangeByStep({ state, action, onChange })
        default:
            return { ...state, isActive: false, value: state.value }
    }
}

export default ({
    min=0,
    max=1,
    value: initialValue,
    angleOffset,
    angleRange,
    size,
    steps = undefined,
    snap = false,
    wrap = false,
    onChange,
}) => {
    const svg = useRef<SVGSVGElement>(null);
    const container = useRef<HTMLDivElement>(null);
    const [{ percentage, value, angle, isActive }, dispatch] = useReducer(
        reducer(onChange),
        {
            isActive: false,
            min,
            max,
            angleOffset,
            angleRange,
            percentage: initialValue ? (max - min) / initialValue : 0,
            value: initialValue || 0,
            svg,
            container,
            size,
            wrap
        }
    )

    useEffect(handleEventListener({ dispatch, isActive }), [isActive])
    return {
        svg,
        container,
        percentage: steps ? findClosest(steps, percentage) : percentage,
        value,
        angle,
        onStart: onMouseMoveStart(dispatch),
        onKeyDown: onKeyDown(dispatch),
        onScroll: onScroll(dispatch),
    }
}
