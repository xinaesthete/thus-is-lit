import React from 'react'
import produce from 'immer'
import { VideoState } from '../../../common/media_model'
import ChooseVideo from './choose_video'
import ToggleButton from '@material-ui/lab/ToggleButton/ToggleButton'
import VolumeMute from '@material-ui/icons/VolumeMute'

interface VProps {
  video: VideoState;
  setVideo: (newVid: VideoState)=>void
}

function MuteToggle(props: VProps) {
  const setMuted=(muted: boolean) => {
    const newVideo = produce(props.video, (draft) => {draft.muted = muted; return draft});
    props.setVideo(newVideo);
  };
  return (
    <>
      <ToggleButton selected={props.video.muted} onChange={()=>setMuted(!props.video.muted)}>
        <VolumeMute />
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
