import { Button, Slider, makeStyles, Typography, Grid } from '@material-ui/core'
import React from 'react'
import KaleidModel from '../../common/KaleidModel';
//maybe want to use material, or just plain-old vanilla dat.gui...
//import DatGui, {DatNumber, DatString} from 'react-dat-gui'
import {Uniforms, Numeric, Tweakable, isNum, isVec2} from '../../common/tweakables'

interface UniformsState {
    data: Uniforms
}

const useStyles = makeStyles({
    root: {
        width: 200
    }
});

function TweakableSlider(u: Tweakable<number>) {
    const classes = useStyles();
    const [value, setValue] = React.useState(u.value);
    const handleChange = (event: any, newValue: number | number[]) => {
        setValue(newValue as number); //how does this propogate back up?
    };
    return (
        <Grid item className={classes.root}>
            <Typography>{u.name || "unnamed?"}</Typography>
            <Slider value={value} min={u.min} max={u.max} onChange={handleChange} />
        </Grid>
    )
}

//maybe more like KaleidModel rather than Uniforms here.
//so how do we make it?
interface KProps {
    kaleid: KaleidModel
}
export function KaleidGUI(props: KProps) {
    const classes = useStyles();
    const [model, setModel] = React.useState(props.kaleid);

    return (
        <Grid container spacing={1}>
            <Grid item className={classes.root}><Typography>ID: {model.id}</Typography></Grid>
            {model.tweakables.map(u => {
                if (isNum(u.value)) {
                    return <TweakableSlider {...u as Tweakable<number>} />
                }
            })}
        </Grid>
    )
}
