import { 
    Accordion, AccordionSummary, AccordionDetails, Slider, Typography, Grid
} from '@material-ui/core'
import ToggleButton from '@material-ui/lab/ToggleButton/ToggleButton'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import React from 'react'
import produce from 'immer'
import {produceWithPatches} from 'immer'
import KaleidModel, { ObservableKaleidModel } from '@common/KaleidModel';
//maybe want to use material, or just plain-old vanilla dat.gui...
//maybe revisit react-dat-gui with benefit of understanding React a bit better.
//import DatGui, {DatNumber, DatString} from 'react-dat-gui'
import {Uniforms, Numeric, Tweakable, isNum, vec2} from '@common/tweakables'
import { sendModel } from '../gui_comms';
import { AbstractImageDecriptor } from '@common/media_model'
import { useStyles } from '../theme'
import AbstractImageController from './video/abstract_image_controller'
import { observer } from 'mobx-react'
import { action } from 'mobx'
import MutatorGrid from './mutator/MutatorGrid'
import { KaleidContext } from '@gui/kaleid_context'

interface SliderProp<T extends Numeric> extends Tweakable<T> {
    // onChangeX: React.ChangeEventHandler<number>
    onChange: (event: React.ChangeEvent<{}>, newValue: T) => void
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
function TweakableSlider(u: SliderProp<Numeric>) {
    ///AAARGGGH noooo... this isNum thing is bad & I seem to be having a bad time with TS generics just now.
    //isVec2() was flat-out useless???
    if (!isNum(u.value)) return TweakableSliderPair(u as SliderProp<vec2>);
    const classes = useStyles();
    //--- state should be owned further up the hierarchy ---
    const { name ='', min, max, value, step = defaultStep(u), onChange } = u as SliderProp<number>;
    //step = defaultStep(u); //TODO: ability to override step quantization - modifier key? switch?
    
    return (
        <>
            <Grid item xs={4} sm={3}>
            <RowLabel name={name} />
            </Grid>
            <Grid item xs={8} sm={9}>
            <Slider className={classes.slider} name={name} min={min} max={max} value={value as number} step={step}
                onChange={(e, v) => {
                    //Slider onChange can define number[]
                    if (typeof v !== 'number') return;
                    onChange(e, v)
                }} 
                valueLabelDisplay="auto" />
            </Grid>
        </>
    )
}

function TweakableSliderPair(u: SliderProp<vec2>) {
    const classes = useStyles();
    const { name='', min, max, value, step = defaultStep(u) } = u;
    //just enough state so that when any one slider changes, we can pass a vec2 to onChange
    const [val, setVal] = React.useState(value); 
    const makeChange = (k: "x" | "y") => (event: any, newComponentValue: number | number[]) => {
        if (typeof newComponentValue !== "number") return;
        const newVal = {...val};
        newVal[k] = newComponentValue;
        setVal(newVal);
        u.onChange(event, newVal);
    }
    return (
        <>
            <Grid item xs={4} sm={3}>
                <RowLabel name={name} />
            </Grid>
            <Grid item xs={8} sm={9}>
            <Slider className={classes.slider} name={name} min={min} max={max} value={val.x} step={step} 
                onChange={makeChange('x')} 
                valueLabelDisplay="auto" />
            <Slider className={classes.slider} name={name} min={min} max={max} value={val.y} step={step} 
                onChange={makeChange('y')} 
                valueLabelDisplay="auto" />
            </Grid>
        </>
    )
}


interface KProps {
    kaleid: ObservableKaleidModel,
}
/** this is actually a fairly generic GUI for making a bunch of sliders for tweakable values.
 * Hopefully soon we'll reason about what different types of models we want,
 * and both how to make more explicitly designed GUIs for something like Kaleid, also what more
 * flexible dynamic models might look like.
 */
const KaleidGUI = observer((props: KProps) => {
    const classes = useStyles();
    //we could / should be a context provider
    //all the more relevant for mutator (which I should implement...)
    const model = props.kaleid; //will probably be the way with mobx / no setModel

    const handleSetImage = action((newImg: AbstractImageDecriptor) => {
        model.imageSource = newImg;
    });

    const [mutateMode, setMutator] = React.useState(false);
    const tweaker = mutateMode ? <MutatorGrid /> :
    (       
    <Grid container spacing={1}>
        {model.tweakables.map((u, i) => {
            return (
                <TweakableSlider key={i} {...u}
                onChange={action((e, v) => { u.value = v; })}
                />
            )
        })}
    </Grid>
    )
    return (
        <div className={classes.uniformsGui}>
        <Accordion TransitionProps={{unmountOnExit: true, timeout: 50}}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel{model.id}-content" 
                id="panel{model.id}-header"
            >
                <Typography>Renderer {model.id}:</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <div>
                <AbstractImageController image={model.imageSource} setImage={handleSetImage} />
                <ToggleButton value={mutateMode} onChange={()=>setMutator(!mutateMode)}>
                    {mutateMode ? "mutator" : "sliders"}
                </ToggleButton>
                <KaleidContext.Provider value={model}>
                    {tweaker}
                </KaleidContext.Provider>
            </div>
            </AccordionDetails>
        </Accordion>
        </div>
    )
});

export default KaleidGUI;