import { IconButton, MenuItem, Select } from '@material-ui/core'
import BugReportIcon from '@material-ui/icons/BugReport';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react'
import { AbstractImageDecriptor, ImageType, VideoDescriptor, VideoStreamDescriptor } from '@common/media_model'

import VideoController from './video_controller'
import mediaLib from '@gui/medialib';
import { sendRefreshVideoElement, sendSetVideoDevice } from '@gui/gui_comms';
import { useKaleid, useLitConfig } from '@gui/kaleid_context';

interface AbsImgProps {
    image: AbstractImageDecriptor;
    setImage: (newImage: AbstractImageDecriptor)=>void
}

/** List available video stream devices. */
function VideoStreamChooser({...props}) {
    const config = useLitConfig();
    if (!config.enableVideoStreamInput) {
        return <></>
    }
    const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
    const [devId, setDevId] = React.useState('');
    const kaleid = useKaleid();
    React.useMemo(async () => {
        setDevices(await mediaLib.getVideoStreamDevices());
    }, []);
    const chooseDevice = action((d: string) => {
        if (!d) return;
        // console.log('video stream selected', d.label);
        const descriptor: VideoStreamDescriptor = {
            deviceId: d, imgType: ImageType.VideoStream, 
            width: 1920, height: 1080 //I should be able to skip these, actually...
        }
        sendSetVideoDevice(d, kaleid.model.id);
        kaleid.vidState.setStreamDevice(d);
        // kaleid.model.imageSource = descriptor;
        setDevId(d);
    });
    return (
        <>
            <Select label="video device" value={devId} onChange={(ev) => {
                chooseDevice(ev.target.value as string);
            }}>
                {devices.map(d => (<MenuItem key={d.deviceId} value={d.deviceId}>{d.label}</MenuItem>))}
            </Select>
        </>
    )
}

export default observer(function AbstractImageController(props: AbsImgProps) {
    //const setAsVideo = props.setImage as (n: AbstractImageDecriptor) => void
    const setAsVideo = action((newVid: VideoDescriptor) => {
        props.setImage(newVid);
    });
    const k = useKaleid();
    return (
        <>
        <IconButton onClick={()=>{
            k.vidState.refreshVidElement();
            k.vidState.setImageState(k.model.imageSource as VideoDescriptor);
            sendRefreshVideoElement();
        }}>
            <BugReportIcon />
        </IconButton>
        {props.image.imgType === ImageType.VideoFile ?
        (<VideoController video={props.image as VideoDescriptor} setVideo={setAsVideo} />)
        : (<VideoStreamChooser />)
        }
        <VideoStreamChooser image={props.image} />
        </>
    )
});
