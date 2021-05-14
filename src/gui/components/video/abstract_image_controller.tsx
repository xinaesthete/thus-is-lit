import { Typography } from '@material-ui/core'
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react'
import { AbstractImageDecriptor, VideoDescriptor } from '@common/media_model'

import VideoController from './video_controller'

interface AbsImgProps {
    image: AbstractImageDecriptor;
    setImage: (newImage: AbstractImageDecriptor)=>void
}
export default observer(function AbstractImageController(props: AbsImgProps) {
    //const setAsVideo = props.setImage as (n: AbstractImageDecriptor) => void
    const setAsVideo = action((newVid: VideoDescriptor) => {
        props.setImage(newVid);
    });
    return (
        <>
        {/* <Typography variant="caption">{props.image.width} * {props.image.height}</Typography> */}
        <VideoController video={props.image as VideoDescriptor} setVideo={setAsVideo} />
        </>
    )
})
