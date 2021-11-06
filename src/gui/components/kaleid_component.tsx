import { Specimen } from '@common/mutator';
import { DomAttributes, Threact } from '@common/threact/threact';
import { useKaleid, useLitConfig } from '@gui/kaleid_context'
import { useAnimationFrame } from '@gui/react_animate';
import { useStyles } from '@gui/theme';
import { observer } from 'mobx-react';
import React from 'react'
import KaleidRenderer from '../../renderer/kaleid_renderer';

const SpecimenVersion = observer(function SpecimenVersion(props: {spec: Specimen}) {
    const classes = useStyles();
    const kaleid = useKaleid();
    const key = 'spec' + props.spec.id;
    const kRender = React.useMemo(()=> {
        return kaleid.getRenderer(key);
    }, []);

    kRender.setParmsFromArray([...props.spec.genes.values()]);
    console.log('react kaleid_component render');
    return <Threact gfx={kRender} className={classes.kaleidComponent} />
});

/**
 * Render kaleidoscope graphics within the GUI.
 * **WARNING: the logic of this is not necessarily particularly sound at the moment and 
 * subject to review. If useLitConfig().livePreviews is false, rendering will be skipped.**
 * @param props.name used as a key for asssociating component with a `KaleidRenderer`
 * @param props.spec flag to apply apply parameter values to model 
 * in current `useKaleid()` context before rendering.
 * @param props.previs set a flag in the shader to render a visualisation of
 * where the kaleidoscope parameters point in the image. This can be used for direct manipulation with GUI.
 * @param props.onClick any DomAttributes (ie, any event handlers etc) will be passed on to the backing `<canvas>`
 */
export default observer(function KaleidComponent(props: { spec?: Specimen, previs?: boolean, name?: string } & DomAttributes) {
    const config = useLitConfig();
    const classes = useStyles();
    const kaleid = useKaleid();
    const {previs, spec, name: key = '', ...dom} = props; //destructure anything that shouldn't be in dom before passing down.
    
    if (!config.livePreviews) {
        return <></>//<div style={{width: '100px', height: '50px', backgroundColor: 'red', opacity: '0.3'}}> </div>
    }
    if (props.spec) return <SpecimenVersion spec={props.spec} />;
    const getRenderer = ()=> {
        const k = kaleid.getRenderer(key);
        if (props.previs) k.previs = true;
        k.parmsHack = config.paramsHack;
        return k;
    };
    // useAnimationFrame(()=> {
    //     //kRender.
    // }); //could be useful (but threact already has its own logic).

    const kRender = React.useMemo(getRenderer, [key, config.paramsHack]);
    return <Threact gfx={kRender} className={classes.kaleidComponent} domAttributes={dom} />
});
