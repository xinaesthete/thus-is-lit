import React from 'react'
import { VideoDescriptor } from '@common/media_model'
import ChooseVideo from './choose_video'
//import ToggleButton from '@material-ui/lab/ToggleButton/ToggleButton'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeUp from '@material-ui/icons/VolumeUp'
import Pause from '@material-ui/icons/Pause'
import PlayArrow from '@material-ui/icons/PlayArrow'
import { useStyles } from '../../theme'
import { observer } from 'mobx-react'
import mediaLib from '../../medialib'
import { action } from 'mobx'
import { Button } from '@material-ui/core'

export interface VProps {
  video: VideoDescriptor;
  setVideo: (newVid: VideoDescriptor)=>void
}

const MuteToggle = observer(function MuteToggle(props: VProps) {
  const classes = useStyles();
  return (
    <>
      <Button className={classes.vidCtrlButton} 
        onClick={action(()=>props.video.muted = !props.video.muted)}>
        { props.video.muted ? <VolumeOff /> : <VolumeUp /> }
      </Button>
    </>
  )
});

const PauseToggle = observer((props: VProps) => {
  const classes = useStyles();
  //TODO: figure out why this isn't actually working.
  return (
    <>
      <Button className={classes.vidCtrlButton} 
        onClick={action(()=>props.video.paused = !props.video.paused)}>
        { props.video.paused ? <PlayArrow /> : <Pause /> }
      </Button>
    </>
  )
});

export default observer(function VideoController(props: VProps) {
  const {video, setVideo} = {...props};
  const setName = async (name: string) => {
    console.log(`[video_controller] setName ${name}`);
    
    const desc = await mediaLib.getDescriptorAsync(name) as VideoDescriptor;
    setVideo(desc);
  }

  return (
    <>
      <ChooseVideo video={video} setURL={setName} />
      <MuteToggle video={video} setVideo={setVideo} />
      <PauseToggle video={video} setVideo={setVideo} />
    </>
  )
});
