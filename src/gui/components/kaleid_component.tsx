import { Specimen } from '@common/mutator';
import { Threact } from '@common/threact/threact';
import { useKaleid, useLitConfig } from '@gui/kaleid_context'
import { useStyles } from '@gui/theme';
import { observer } from 'mobx-react';
import React from 'react'
import KaleidRenderer from '../../renderer/kaleid_renderer';

const SpecimenVersion = observer(function SpecimenVersion(props: {spec: Specimen}) {
    const classes = useStyles();
    const kaleid = useKaleid();
    const kRender = React.useMemo(()=> new KaleidRenderer(kaleid.vidState, kaleid.model), []);
    kRender.setParmsFromArray([...props.spec.genes.values()]);
    console.log('react kaleid_component render');
    return <Threact gfx={kRender} className={classes.kaleidComponent} />
});

/**
 * Render kaleidoscope graphics within the GUI.
 * If `spec` is provided, it'll be used to apply apply parameter values to model 
 * in current `useKaleid()` context before rendering.
 * **WARNING: the logic of this is not necessarily particularly sound at the moment and 
 * subject to review.**
 * If `previs` is `true`, it'll set a flag in the shader to render a visualisation of
 * where the kaleidoscope parameters point in the image (this is currently being used
 * to help with debugging, but is also hoped to form the basis of a better GUI with
 * direct visual manipulation)
 */
export default observer(function KaleidComponent(props: { spec?: Specimen, previs?: boolean }) {
    const config = useLitConfig();
    const classes = useStyles();
    const kaleid = useKaleid();
    
    if (!config.livePreviews) {
        return <div style={{width: '100px', height: '50px', backgroundColor: 'red', opacity: '0.3'}}> </div>
    }
    if (props.spec) return <SpecimenVersion spec={props.spec} />;
    const makeRenderer = ()=> {
        const k = new KaleidRenderer(kaleid.vidState, kaleid.model);
        if (props.previs) k.previs = true;
        k.parmsHack = true;
        return k;
    };
    const kRender = React.useMemo(makeRenderer, [makeRenderer]);
    return <Threact gfx={kRender} className={classes.kaleidComponent} />
});
