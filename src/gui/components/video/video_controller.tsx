import React from 'react'
import produce from 'immer'
import { VideoDescriptor } from '../../../common/media_model'
import ChooseVideo from './choose_video'
import ToggleButton from '@material-ui/lab/ToggleButton/ToggleButton'
import VolumeMute from '@material-ui/icons/VolumeMute'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeUp from '@material-ui/icons/VolumeUp'
import { useStyles } from '../../theme'

export interface VProps {
  video: VideoDescriptor;
  setVideo: (newVid: VideoDescriptor)=>void
}

function MuteToggle(props: VProps) {
  const classes = useStyles();
  const setMuted=(muted: boolean) => {
    const newVideo = produce(props.video, (draft) => {draft.muted = muted; return draft});
    props.setVideo(newVideo); //should be fine way of changing state?
  };
  return (
    <>
      <ToggleButton className="mute" value={props.video.muted} onChange={()=>setMuted(!props.video.muted)}>
        { props.video.muted ? <VolumeOff /> : <VolumeUp /> }
      </ToggleButton>
    </>
  )
}

export default function VideoController(props: VProps) {
  //useContext? MobX?
  const {video, setVideo} = {...props};
  const setName = (name: string) => {
    console.log(`setName`);
    setVideo(produce(video, draft => {
      draft.url = name;
    }));
  }

  return (
    <>
      <ChooseVideo currentVideo={video.url} setURL={setName} />
      <MuteToggle video={video} setVideo={setVideo} />
    </>
  )
}
