import { 
    Slider, Typography, Grid, IconButton, Switch
} from '@material-ui/core'
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import React from 'react'
import MovementControl from './movement_control'
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
import KnobPanel from './knob_panel';

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
export const defaultStep = (u: hasOptionalRange) => {
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

const Toggle = observer((u: SliderProp<Numeric>) => {
    return <Switch checked={u.value > 0.5} onChange={action((e, v) => {
        const n = v ? 1 : 0;
        console.log('setting', u.name, n);
        u.onChange(n);
    })}></Switch>
})
const SpecialWidget = observer((u: SliderProp<Numeric>) => {
    if (!isNum(u.value)) return <KaleidImageCentre {...u as SliderProp<vec2>} />
    return <Toggle {...u} />
});

const TweakableWidget = observer((u: SliderProp<Numeric>) => {
    const useWidgets = useLitConfig().enableSpecialWidgets;
    const f = () => {
        if (useWidgets && u.specialWidget) return <SpecialWidget {...u} />
        return <TweakableSlider {...u} />
    }
    const el = React.useMemo(f, [f, useWidgets]);
    return (
    <>
            <Grid item xs={4} sm={3}>
            <RowLabel name={u.name!} />
            <MovementControl {...u} />
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

interface BankProps { tag?: string }
const SliderBank = observer((props: BankProps) => {
    const { tag } = props;
    const config = useLitConfig();
    const kaleidContext = useKaleid();
    if (config.newGui) return <KnobPanel />;
    const t = React.useMemo(()=>{
        const all = kaleidContext.model.tweakables;
        const tagMatch = typeof tag !== 'string' ? all : all.filter(t => t.tags && t.tags.includes(tag));
        return config.showDebugSettings ?  tagMatch : tagMatch.filter((t) => t.tags && !t.tags.includes('debug'))
    }, [config.showDebugSettings]);
    //const geos = React.useMemo(()=>kaleidContext.model.tweakables.filter((t) => t.tags && t.tags[0] === 'geometry'), []);
    //const cols = React.useMemo(()=>kaleidContext.model.tweakables.filter((t) => t.tags && t.tags[0] === 'colour'), []);
    return (
        <Grid container spacing={1}>
            {t.map((u, i) => {
                return (
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
                )
            })}
        </Grid>
    )
});

export default SliderBank;