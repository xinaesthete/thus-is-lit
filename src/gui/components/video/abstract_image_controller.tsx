import { Typography } from '@material-ui/core'
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
        <>
        <Typography variant="caption">{props.image.width} * {props.image.height}</Typography>
        <VideoController video={props.image as VideoState} setVideo={setAsVideo} />
        </>
    )
}
