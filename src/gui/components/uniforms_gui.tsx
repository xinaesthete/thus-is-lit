import { 
    Slider, Typography, Grid
} from '@material-ui/core'
import React from 'react'
//maybe want to use material, or just plain-old vanilla dat.gui...
//maybe revisit react-dat-gui with benefit of understanding React a bit better.
//import DatGui, {DatNumber, DatString} from 'react-dat-gui'
import {Numeric, Tweakable, isNum, vec2} from '@common/tweakables'
import { useStyles } from '../theme'
import { observer } from 'mobx-react'
import { action } from 'mobx'
import { useKaleid, useLitConfig } from '@gui/kaleid_context'
import { sendParameterValue } from '@gui/gui_comms'
import KaleidImageCentre from './kaleid_imagecentre_widget'

export interface SliderProp<T extends Numeric> extends Tweakable<T> {
    modelId: number;
    // onChangeX: React.ChangeEventHandler<number>
    // onChange: (event: React.ChangeEvent<{}>, newValue: T) => void
    onChange: (newValue: T) => void
}


function RowLabel(props: {name: string}) {
    const classes = useStyles();
    return <Typography className={classes.root}>{props.name}</Typography>
}
interface hasOptionalRange {min?: number, max?: number}
const defaultStep = (u: hasOptionalRange) => {
    const {max=1, min=0} = {...u};
    return (max - min) / 200.;
}
const TweakableSlider = observer(function _TweakableSlider(u: SliderProp<Numeric>) {
    ///AAARGGGH noooo... this isNum thing is bad & I seem to be having a bad time with TS generics just now.
    //isVec2() was flat-out useless???
    if (!isNum(u.value)) return <TweakableSliderPair {...(u as SliderProp<vec2>)} />;
    const classes = useStyles();
    //--- state should be owned further up the hierarchy ---
    const { name ='', min, max, value, step = defaultStep(u), onChange } = u as SliderProp<number>;
    //step = defaultStep(u); //TODO: ability to override step quantization - modifier key? switch?
    
    return (
        <>
            <Slider className={classes.slider} name={name} min={min} max={max} value={value as number} step={step}
                onChange={action((e, v) => {
                    //Slider onChange can define number[]
                    if (typeof v !== 'number') return;
                    onChange(v);
                })} 
                valueLabelDisplay="auto" />
        </>
    )
});

const TweakableSliderPair = observer(function _TweakableSliderPair(u: SliderProp<vec2>) {
    const classes = useStyles();
    const { name='', min, max, value, step = defaultStep(u) } = u;
    //just enough state so that when any one slider changes, we can pass a vec2 to onChange
    const [val, setVal] = React.useState(value);
    const makeChange = (k: "x" | "y") => (event: any, newComponentValue: number | number[]) => {
        if (typeof newComponentValue !== "number") return;
        const newVal = {...val};
        newVal[k] = newComponentValue;
        setVal(newVal);
        u.onChange(newVal);
    }
    return (
        <>
            <Slider className={classes.slider} name={name} min={min} max={max} value={val.x} step={step} 
                onChange={action(makeChange('x'))}
                valueLabelDisplay="auto" />
            <Slider className={classes.slider} name={name} min={min} max={max} value={val.y} step={step} 
                onChange={action(makeChange('y'))}
                valueLabelDisplay="auto" />
        </>
    )
});

const TweakableWidget = observer((u: SliderProp<Numeric>) => {
    const useWidgets = useLitConfig();
    const f = () => {
        if (useWidgets && u.specialWidget) return <KaleidImageCentre {...u as SliderProp<vec2>} />
        return <TweakableSlider {...u} />
    }
    const el = React.useMemo(f, [f, useWidgets]);
    return (
    <>
            <Grid item xs={4} sm={3}>
            <RowLabel name={u.name!} />
            </Grid>
            <Grid item xs={8} sm={9}>
                {el}
            </Grid>
    </>
    )
});

const SliderBank = observer(() => {
    const kaleidContext = useKaleid();
    //const model = kaleidContext.model; //dereference late (see 'mobx react optimizations')
    //TODO: don't use array indices as keys. (actually ok at the time of writing as they're not changing)
    //--- if I implement a 'filter' then indices are liable to change, depending on how the filter works.
    return (
        <Grid container spacing={1}>
            {kaleidContext.model.tweakables.map((u, i) => {
                return (
                    <TweakableWidget key={u.name} {...u} modelId={kaleidContext.model.id}
                    onChange={action((v) => {
                        u.value = v;
                        //no need for a mobx reaction, straightforward side-effect
                        sendParameterValue(u, kaleidContext.model.id);
                    })}
                    />
                )
            })}
        </Grid>
    )
});

export default SliderBank;