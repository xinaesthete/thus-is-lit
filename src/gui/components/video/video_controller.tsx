import React from 'react'
import produce from 'immer'
import { VideoState } from '../../../common/media_model'
import ChooseVideo from './choose_video'
import ToggleButton from '@material-ui/lab/ToggleButton/ToggleButton'
import VolumeMute from '@material-ui/icons/VolumeMute'
import VolumeOff from '@material-ui/icons/VolumeOff'
import VolumeUp from '@material-ui/icons/VolumeUp'

interface VProps {
  video: VideoState;
  setVideo: (newVid: VideoState)=>void
}

function MuteToggle(props: VProps) {
  const setMuted=(muted: boolean) => {
    const newVideo = produce(props.video, (draft) => {draft.muted = muted; return draft});
    props.setVideo(newVideo); //should be fine way of changing state?
  };
  /*
  Warning: Failed prop type: The prop `value` is marked as required in `ForwardRef(ToggleButton4)`, but its value is `undefined`.
    at ToggleButton4 (file:///C:/code/thus-is-lit/public/build/gui.js:22302:28)
    at WithStyles(ForwardRef(ToggleButton4)) (file:///C:/code/thus-is-lit/public/build/gui.js:27388:33)
    at MuteToggle (file:///C:/code/thus-is-lit/public/build/gui.js:46313:23)
  */
  //selected={props.video.muted} is not enough, we need value or react shouts at us.
  //actually, let's just switch the icon instead of using selected (todo review purpose of selected).
  return (
    <>
      <ToggleButton value={props.video.muted} onChange={()=>setMuted(!props.video.muted)}>
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
