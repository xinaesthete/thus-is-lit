import { Specimen } from '@common/mutator';
import { Threact } from '@common/threact/threact';
import { Numeric } from '@common/tweakables';
import { useKaleid } from '@gui/kaleid_context'
import { observer } from 'mobx-react';
import React from 'react'
import KaleidRenderer from '../../renderer/kaleid_renderer';

export default observer(function KaleidComponent(props: { spec: Specimen }) {
    const kaleid = useKaleid();
    const [kRender] = React.useState(new KaleidRenderer(kaleid.vidState));
    kRender.setParmsFromArray([...props.spec.genes.values()]);
    console.log('react kaleid_component render');
    return <Threact gfx={kRender} />
})
