import React, { useEffect } from 'react'
import Button from '@material-ui/core/Button';
import MuiAlert from '@material-ui/lab/Alert';
import { requestModelList, requestNewRenderer } from '@gui/gui_comms';
import { makeStyles, Theme } from '@material-ui/core';
import KaleidGUI from './uniforms_gui';
import { KaleidContext, useKaleidList } from '@gui/kaleid_context';
import { observer } from 'mobx-react';
import { useStyles } from '@gui/theme';

function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />
}

export default observer(function RendererControl() {
    const classes = useStyles();
    //previously useState, made context for access across other parts of app.
    const listContext = useKaleidList();
    const {renderModels, setRenderModels} = listContext;
    
    const [init, setInit] = React.useState(false);
    useEffect(() => {
        setInit(true);
        if (renderModels.length === 0) requestModelList().then(models => {
            console.log(`got ${models.length} existing models from server`);
            setRenderModels(models); //action
        });
    }, [init]);

    return (
        <>
        <Button className={classes.root} variant="contained" color="primary" onClick={
            async () => {
                const m = await requestNewRenderer(); //the only way we know a renderer is there at the moment
                //is that we request one via REST and get a response here.
                //(it should be possible to be pushed over socket by server as well, or instead)

                const newModels = [...renderModels, m];
                setRenderModels(newModels); //action
            }
        }>Make new renderer</Button>
        {renderModels.map((m,i)=> (
            <KaleidContext.Provider key={m.model.id} value={m}>
                <KaleidGUI />
            </KaleidContext.Provider>
        ))}
        </>
    )
});
