import { 
    Accordion, AccordionSummary, AccordionDetails, Slider, Typography, Grid
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import React from 'react'
import produce from 'immer'
import {produceWithPatches} from 'immer'
import KaleidModel from '../../common/KaleidModel';
//maybe want to use material, or just plain-old vanilla dat.gui...
//maybe revisit react-dat-gui with benefit of understanding React a bit better.
//import DatGui, {DatNumber, DatString} from 'react-dat-gui'
import {Uniforms, Numeric, Tweakable, isNum, vec2} from '../../common/tweakables'
import { sendModel } from '../gui_comms';
import VideoController from './video/video_controller'
import {AbstractImageDecriptor, VideoDescriptor} from '../../common/media_model'
import { useStyles } from '../theme'
import AbstractImageController from './video/abstract_image_controller'

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
        ///this doesn't seem to work... is passing event through like this wrong?
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

// function FilterBox({filterText: string}) {
//     // I'm sure there's a good way I can abstract the label / child thing so I can style coherently
//     return (
//         <>
//             {/* <RowLabel {..."filter"} /> */}

//         </>
//     )
// }


//maybe more like KaleidModel rather than Uniforms here.
interface KProps {
    kaleid: KaleidModel,
}
export function KaleidGUI(props: KProps) {
    const classes = useStyles();
    const [model, setModel] = React.useState(props.kaleid);

    const handleSetImage = (newImg: AbstractImageDecriptor) => {
        //setFilename(newName);
        const newModel = produce(model, draftState => {
            draftState.imageSource = newImg; //turtles all the way down (there is a better way)
        });
        setModel(newModel);
        //sending model to renderer might be an idea (via host ws)
        sendModel(newModel);
    };
    // const [filterText, setFilterText] = React.useState(/.*/g);

    function makeSliderHandler(key: string, i: number) {
        return (event: any, newValue: Numeric) => {
            //need to be careful about deep vs shallow copy when making new state.
            //Also, we could easily generate a lot of garbage here *which sucks*
            //because we want to do cool realtime stuff.
            //Would it make sense to use a pool? Would that confuse React?
            //https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript?rq=1
            
            //https://medium.com/@housecor/handling-state-in-react-four-immutable-approaches-to-consider-d1f5c00249d5
            //adding immer
            //ALSO NOTE setState calls are batched, callback form of setState will run after completion
            const newModel = produce(model, draftState=> {
                //draftState.tweakables[key].value = newValue; //duh, tweakables is an array
                const arr = draftState.tweakables;
                //XXX::: this is not technically correct / safe: there is no guarantee that tweakable names are unique.
                //in general we're really expecting the tweakables array not to change order / size etc and
                //MOST CERTAINLY HAVE NOT TESTED anything that involves anything like that, and don't intend to any time soon.
                if (i >= arr.length || arr[i].name !== key) i = draftState.tweakables.findIndex(t=>t.name === key);
                if (i === -1) return draftState;
                const t = draftState.tweakables[i];
                //console.log(`changing ${key} from ${JSON.stringify(t.value)} to ${JSON.stringify(newValue)}`);
                t.value = newValue;
            });
            setModel(newModel);
            //sending model to renderer might be an idea (via host ws)
            sendModel(newModel);
        }
    }

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
                <Grid container spacing={1}>
                {model.tweakables.map((u, i) => {
                    return (
                        <TweakableSlider key={i} {...u}
                        onChange={makeSliderHandler(u.name!, i)}
                        />
                    )
                })}
                </Grid>
            </div>
            </AccordionDetails>
        </Accordion>
        </div>
    )
}
