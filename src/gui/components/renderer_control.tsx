import React from 'react'
import produce from 'immer'
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { requestNewRenderer } from '../gui_comms';
import { makeStyles, Theme } from '@material-ui/core';
import KaleidModel from '../../common/KaleidModel'
import { KaleidGUI } from './uniforms_gui';

function Alert(props) {
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

function OldNewRendererButton() {
    //should makeLight itself make something, or do we wrap it?
    //still not very fluent in react, basing on https://material-ui.com/components/snackbars/
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [model, setModel] = React.useState(undefined as KaleidModel);
    //const [renderers, addRenderer] = React.useState([] as KaleidModel[])

    const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    const modelGui = (model === undefined) ? <></> : <KaleidGUI kaleid={model} />

    return (
        <>
            <Button className={classes.root} variant="contained" color="primary" onClick={async () => {
                const m = await requestNewRenderer();
                setOpen(true);
                setModel(m);
            }}>
                is this it?
        </Button>
            <Button className={classes.root} variant="contained" color="primary" onClick={() => {
                const m: KaleidModel = {
                    id: 42, filename: "test", tweakables: [
                        { name: "fake", value: 0.3, min: 0, max: 10 }
                    ]
                }
                setModel(m);
            }}>
                this certainly isn't
        </Button>
            {modelGui}
            <Snackbar open={open} autoHideDuration={1000} onClose={handleClose}>
                <Alert severity="success">
                    New renderer initialised.
          </Alert>
            </Snackbar>
        </>
    );
}


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
