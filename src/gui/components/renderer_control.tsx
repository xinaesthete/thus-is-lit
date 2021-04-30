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
        <Button className={classes.root} variant="contained" color="primary" onClick={requestNewRenderer}>
            Make new renderer
        </Button>
        {renderModels.map((m,i)=> (
            <KaleidContext.Provider key={m.model.id} value={m}>
                <KaleidGUI />
            </KaleidContext.Provider>
        ))}
        </>
    )
});
