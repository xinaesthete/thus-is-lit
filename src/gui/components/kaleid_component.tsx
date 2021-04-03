import { Threact } from '@common/threact/threact';
import { Numeric } from '@common/tweakables';
import { KaleidContext } from '@gui/kaleid_context'
import React from 'react'
import KaleidRenderer from 'renderer/kaleid_renderer';

export default function KaleidComponent(props: { parms: Numeric[] }) {
    const kaleid = React.useContext(KaleidContext);
    const [kRender] = React.useState(new KaleidRenderer(kaleid.vidState));
    kRender.setParmsFromArray(props.parms);
    return <Threact gfx={kRender} />
}
