import { Threact } from '@common/threact/threact';
import { DefaultCube } from '@common/threact/threexample';
import { KaleidContext } from '@gui/kaleid_context'
import React from 'react'
//import KaleidRenderer from 'renderer/kaleid_renderer';

export default function DummyCube() {
    const [cube] = React.useState(new DefaultCube());
    return <Threact gfx={cube} />
}

// function KaleidComponent() {
//     //TODO: work on video_state etc such that this stands a fighting chance of working.
//     //should be possible to render multiple things from same source, as well as different sources.
//     const [kRender] = React.useState(new KaleidRenderer());
//     return <Threact gfx={kRender} />
// }
