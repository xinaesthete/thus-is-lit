import React, { useEffect } from 'react'
import Button from '@material-ui/core/Button';
import { requestModelList, requestNewRenderer } from '@gui/gui_comms';
import RenderControlContainer from './render_gui_container';
import { KaleidContext, useKaleidList, useLitConfig } from '@gui/kaleid_context';
import { observer } from 'mobx-react';
import { useStyles } from '@gui/theme';


export default observer(function RendererControl() {
    const classes = useStyles();
    const listContext = useKaleidList();
    const config = useLitConfig();
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
        <Button className={classes.root} variant="contained" color="primary" onClick={()=>requestNewRenderer(undefined, config.presentation)}>
            Make new renderer
        </Button>
        {renderModels.map((m,i)=> (
            <KaleidContext.Provider key={m.model.id} value={m}>
                <RenderControlContainer />
            </KaleidContext.Provider>
        ))}
        </>
    )
});
