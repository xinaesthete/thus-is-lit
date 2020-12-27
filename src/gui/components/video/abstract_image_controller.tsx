import { Typography } from '@material-ui/core'
import React from 'react'
import { AbstractImageDecriptor, VideoDescriptor } from '../../../common/media_model'

import VideoController, { VProps } from './video_controller'

interface AbsImgProps {
    image: AbstractImageDecriptor;
    setImage: (newImage: AbstractImageDecriptor)=>void
}
export default function AbstractImageController(props: AbsImgProps) {
    const setAsVideo = props.setImage as (n: AbstractImageDecriptor) => void
    return (
        <>
        <Typography variant="caption">{props.image.width} * {props.image.height}</Typography>
        <VideoController video={props.image as VideoDescriptor} setVideo={setAsVideo} />
        </>
    )
}
