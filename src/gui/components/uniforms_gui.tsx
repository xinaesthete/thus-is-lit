import { 
    Slider, Typography, Grid, IconButton
} from '@material-ui/core'
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import React from 'react'
import { Donut } from 'react-dial-knob'
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
    return <Typography style={{textAlign: "right"}}>{props.name}</Typography>
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

const LagOffsetControl = observer((u: Tweakable<Numeric>) => {
    //maybe if things like this were inside a 'speed dial'?
    //--- lagOffset ok, but really other kinds of movement are what I want. ---
    const {lagOffset=0, name=''} = u;
    const k = useKaleid();
    if (lagOffset === undefined) return <></>
    return <Donut
        value={lagOffset} min={-60} max={60} step={1} diameter={15} 
        onValueChange={action((v)=>{
            //u.lagOffset = t;
            const t = k.model.tweakables.find(t => t.name === u.name);
            if (t) {
                t.lagOffset = v;
                sendParameterValue(t, k.model.id);
            }
            })}
    />
    return <Slider name={name + 'lag'} min={-60} max={60} value={lagOffset} step={1} onChange={action((ev, v) => {
        if (typeof v !== 'number') return;
        // u.lagOffset = v;
        const t = k.model.tweakables.find(t => t.name === u.name);
        if (t) {
            t.lagOffset = v;
            sendParameterValue(t, k.model.id);
        }
    })} />
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
            <LagOffsetControl {...u} />
            </Grid>
            <Grid item xs={8} sm={9}>
                <IconButton style={{padding: 0}}
                onClick={()=>{if (u.default !== undefined) u.onChange(u.default);}}>
                    <RotateLeftIcon />
                </IconButton>
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
                    <>
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
                    </>
                )
            })}
        </Grid>
    )
});

export default SliderBank;