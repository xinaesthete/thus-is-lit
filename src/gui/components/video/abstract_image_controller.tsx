import React from 'react'
import { AbstractImageState, VideoState } from '../../../common/media_model'

import VideoController, { VProps } from './video_controller'

interface AbsImgProps {
    image: AbstractImageState;
    setImage: (newImage: AbstractImageState)=>void
}
export default function AbstractImageController(props: AbsImgProps) {
    const setAsVideo = props.setImage as (n: AbstractImageState) => void
    return (
        <VideoController video={props.image as VideoState} setVideo={setAsVideo} />
    )
}