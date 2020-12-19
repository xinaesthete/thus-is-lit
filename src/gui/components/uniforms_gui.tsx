import { Button, Slider, makeStyles, Typography, Grid } from '@material-ui/core'
import React from 'react'
import produce from 'immer'
import {produceWithPatches} from 'immer'
import KaleidModel from '../../common/KaleidModel';
//maybe want to use material, or just plain-old vanilla dat.gui...
//import DatGui, {DatNumber, DatString} from 'react-dat-gui'
import {Uniforms, Numeric, Tweakable, isNum, isVec2} from '../../common/tweakables'
import { sendModel } from '../gui_comms';

interface SliderProp extends Tweakable<number> {
    // onChangeX: React.ChangeEventHandler<number>
    onChange: (event: React.ChangeEvent<{}>, newValue: number) => void
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

function TweakableSlider(u: SliderProp) {
    //--- state should be owned further up the hierarchy ---
    const { name, min, max, value, step } = u;
    return (
        <>
            <RowLabel name={name} />
            <Slider name={name} min={min} max={max} value={value} step={step} onChange={u.onChange} valueLabelDisplay="auto" />
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

    const makeSliderHandler = (key: string, i: number) => {
        return (event: any, newValue: number) => {
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
        <>
        <Typography>ID: {model.id}</Typography>
            {model.tweakables.map((u, i) => {
                if (isNum(u.value)) {
                    // {...u as T} definitely not right here: TS is happy with that, React is not.
                    const {name, min, max, value, step} = u;
                    return (
                    <TweakableSlider key={i} name={name} min={min} max={max} value={value} step={step}
                        onChange={makeSliderHandler(u.name, i)
                    }
                    />
                    )
                }
            })}
        </>
    )
}
