import React, { useEffect } from 'react'
import produce from 'immer'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import * as media from '../../medialib'
import { httpURL } from '../../../common/constants'

export default function ChooseVideo(props: { 
  currentVideo: string, setURL: (url: string) => void,
//  availableVideos: string[] //feels like we shouldn't have to pass this in as a prop.
}) {
  
  const [availableVideos, setAvailableVideos] = React.useState([props.currentVideo]);
  useEffect(() => {
    media.getListVideos().then(vids => {
      setAvailableVideos(vids);
    });
  });
  //TODO options for advance to next video in sequence / random after it finishes.
  const [video, setVideo] = React.useState(props.currentVideo);
  //const video = props.currentVideo;
  const handleChoose = (n: string) => {
    setVideo(n); //consider resetting time as well...
    props.setURL(n);
  }
  console.log(`rendering <ChooseVideo currentVideo={"${video}"}`);
  
  const notNice = `${httpURL}/video/`.length;
  const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
  const availableMenu = availableVideos.map(v => ( <MenuItem key={v} value={v}>{niceName(v)}</MenuItem> ));
  return (
    <>
      <Select label="video file" value={video} 
        onChange={e=>handleChoose(e.target.value as string)}>
        {availableMenu}
      </Select>
    </>
  )
}
