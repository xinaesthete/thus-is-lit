import { 
    Accordion, AccordionSummary, AccordionDetails, Slider, makeStyles, Typography, Grid 
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

interface SliderProp<T extends Numeric> extends Tweakable<T> {
    // onChangeX: React.ChangeEventHandler<number>
    onChange: (event: React.ChangeEvent<{}>, newValue: T) => void
}


const useStyles = makeStyles({
    root: {
        width: 200
    }
});

function RowLabel(props: {name: string}) {
    const classes = useStyles();
    return <Typography className={classes.root}>{props.name}</Typography>
}
const defaultStep = (u: SliderProp<Numeric>) => (u.max - u.min) / 200.;
function TweakableSlider(u: SliderProp<Numeric>) {
    ///AAARGGGH noooo... this isNum thing is bad & I seem to be having a bad time with TS generics just now.
    //isVec2() was flat-out useless???
    if (!isNum(u.value)) return TweakableSliderPair(u as SliderProp<vec2>);
    const classes = useStyles();
    //--- state should be owned further up the hierarchy ---
    const { name, min, max, value, step = defaultStep(u), onChange } = u as SliderProp<number>;
    
    return (
        <>
            <RowLabel name={name} />
            <Slider className={classes.root} name={name} min={min} max={max} value={value as number} step={step}
                onChange={onChange} 
                valueLabelDisplay="auto" />
        </>
    )
}

function TweakableSliderPair(u: SliderProp<vec2>) {
    const classes = useStyles();
    const { name, min, max, value, step = defaultStep(u) } = u;
    //just enough state so that when any one slider changes, we can pass a vec2 to onChange
    const [val, setVal] = React.useState(value); 
    const makeChange = (k: "x" | "y") => (event: any, newComponentValue: number) => {
        const newVal = {...val};
        newVal[k] = newComponentValue;
        setVal(newVal);
        ///this doesn't seem to work... is passing event through like this wrong?
        u.onChange(event, newVal);
    }
    return (
        <>
            <RowLabel name={name} />
            <Slider className={classes.root} name={name} min={min} max={max} value={val.x} step={step} 
                onChange={makeChange('x')} 
                valueLabelDisplay="auto" />
            <Slider className={classes.root} name={name} min={min} max={max} value={val.y} step={step} 
                onChange={makeChange('y')} 
                valueLabelDisplay="auto" />
        </>
        
    )
}

function FilterBox({filterText: string}) {
    // I'm sure there's a good way I can abstract the label / child thing so I can style coherently
    return (
        <>
            {/* <RowLabel {..."filter"} /> */}

        </>
    )
}

function FilenameBox(){

}

//maybe more like KaleidModel rather than Uniforms here.
//so how do we make it?
interface KProps {
    kaleid: KaleidModel,
}
export function KaleidGUI(props: KProps) {
    const classes = useStyles();
    const [model, setModel] = React.useState(props.kaleid);
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
                if (i >= arr.length || arr[i].name !== key) i = draftState.tweakables.findIndex(t=>t.name === key);
                if (i === -1) return;
                draftState.tweakables[i].value = newValue;
            });
            setModel(newModel);
            //sending model to renderer might be an idea (via host ws)
            sendModel(newModel);
        }
    }

    return (
        <div className={classes.root}>
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel{model.id}-content" 
                id="panel{model.id}-header"
            >
                <Typography>Renderer {model.id}:</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <div>
            {model.tweakables.map((u, i) => {
//                if (isNum(u.value)) {
                    // {...u as T} definitely not right here: TS is happy with that, React is not.
                    const {name, min, max, value, step} = u;
                    return (
                        <TweakableSlider key={i} name={name} min={min} max={max} value={value} step={step}
                        onChange={makeSliderHandler(u.name, i)
                        }
                        />
                        )
//                    } else if (isVec2(u.value)) {
                        //TODO.
//                    }
                })}
            </div>
            </AccordionDetails>
        </Accordion>
        </div>
    )
}
