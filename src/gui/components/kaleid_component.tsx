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


export default observer(function KaleidComponent(props: { spec?: Specimen }) {
    const config = useLitConfig();
    const classes = useStyles();
    const kaleid = useKaleid();
    
    if (!config.livePreviews) {
        return <div style={{width: '100px', height: '50px', backgroundColor: 'red', opacity: '0.3'}}> </div>
    }
    if (props.spec) return <SpecimenVersion spec={props.spec} />;
    const kRender = React.useMemo(()=> new KaleidRenderer(kaleid.vidState, kaleid.model), []);
    return <Threact gfx={kRender} className={classes.kaleidComponent} />
})
