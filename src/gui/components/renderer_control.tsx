import React from 'react'
import produce from 'immer'
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { requestNewRenderer } from '../gui_comms';
import { makeStyles, Theme } from '@material-ui/core';
import KaleidModel from '../../common/KaleidModel'
import { KaleidGUI } from './uniforms_gui';

function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />
}
const useStyles = makeStyles((theme: Theme) => ({
    root: {
        width: '30%',
        '& > * + *': {
            marginTop: theme.spacing(2)
        },
    },
}));

export default function RendererControl() {
    const classes = useStyles();
    const [renderModels, setRenderModels] = React.useState([] as KaleidModel[])

    return (
        <>
        <Button className={classes.root} variant="contained" color="primary" onClick={
            async () => {
                const m = await requestNewRenderer();
                const newModels = produce(renderModels, (draftState) => {
                    draftState.push(m);
                    return draftState;
                })
                setRenderModels(newModels);
            }
        }>Make new renderer</Button>
        {renderModels.map((m,i)=> <KaleidGUI key={i} kaleid={m} />)}
        </>
    )
}
