import React, { useEffect } from 'react'
import produce from 'immer'
import Button from '@material-ui/core/Button';
import MuiAlert from '@material-ui/lab/Alert';
import { requestModelList, requestNewRenderer } from '../gui_comms';
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
    // this should be brought into a wider mobx state, which would help us do things like 'assign to renderer'
    // from within media_browser.
    const [renderModels, setRenderModels] = React.useState([] as KaleidModel[]);
    //we can pull from server, similarly to how we do other things...
    //this is not nice, but may be ok for now.
    useEffect(() => {
        if (renderModels.length === 0) requestModelList().then(models => {
            setRenderModels(models); //bang. we had models[0].muted as well as models[0].video.muted ->> red herring
            //is setting the array like this bad? immer version doesn't fix anything.
        });
    }, []);

    return (
        <>
        <Button className={classes.root} variant="contained" color="primary" onClick={
            async () => {
                const m = await requestNewRenderer(); //the only way we know a renderer is there at the moment
                //is that we request one via REST and get a response here.

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
