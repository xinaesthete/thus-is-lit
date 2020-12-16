import { Button, Slider, makeStyles, Typography, Grid } from '@material-ui/core'
import React from 'react'
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

function TweakableSlider(u: Tweakable<number>, name: string) {
    const classes = useStyles();
    
    return (
        <Grid item className={classes.root}>
            <Typography>{name}</Typography>
            <Slider min={u.min} max={u.max} />
        </Grid>
    )
}

//maybe more like KaleidModel rather than Uniforms here.
export class UniformGui extends React.Component<Uniforms, UniformsState> {
    state = {
        data: {
            'x': {value: 0.5, min: -1, max: 1},
            'y': {value: 0.5, min: -1, max: 1},
        } as Uniforms
    }


    handleUpdate = newData => {
        //...output the data to outside where it's needed.
        this.setState(prevState => ({
            data: {...prevState.data, ...newData}
        }))
    }

    render() {
        const { data } = this.state;

        return (
            //strongly suspect shoe-horning in to react-dat-gui will be harder than making something more fitting to the shape of my data.
            <Grid container spacing={1}>
                {Object.keys(data).map(k => {
                    const u = data[k] as Tweakable<any>;
                    if (isNum(u.value)) {
                        return <TweakableSlider {...u as Tweakable<number>} name={k}></TweakableSlider>
                    }
                })}
            </Grid>
            // <DatGui data={data} onUpdate={this.handleUpdate}>
            //     {Object.keys(data).map(k => {
            //         const u = data[k] as Tweakable<any>;
            //         if (isNum(u.value)) {
            //             return <DatNumber path={`${k}.value`} label={k}></DatNumber>
            //         }
            //     })}
            // </DatGui>
        )
    }
}
