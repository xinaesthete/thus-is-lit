import { Threact } from '@common/threact/threact';
import { Numeric } from '@common/tweakables';
import { KaleidContext } from '@gui/kaleid_context'
import { observer } from 'mobx-react';
import React from 'react'
import KaleidRenderer from 'renderer/kaleid_renderer';

export default observer(function KaleidComponent(props: { parms: Numeric[] }) {
    const kaleid = React.useContext(KaleidContext);
    const [kRender] = React.useState(new KaleidRenderer(kaleid.vidState));
    kRender.setParmsFromArray(props.parms);
    console.log('react kaleid_component render');
    return <Threact gfx={kRender} />
})
