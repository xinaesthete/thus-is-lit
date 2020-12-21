import React from 'react'
import produce from 'immer'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import * as media from '../medialib'
import { httpURL } from '../../common/constants'

export default function ChooseVideo(props: { 
  currentVideo: string, setFilename: (filename: string) => void,
//  availableVideos: string[] //feels like we shouldn't have to pass this in as a prop.
}) {
  
  //is this how we write React components?
  const [availableVideos, setAvailableVideos] = React.useState([props.currentVideo]);
  //or more to the point, how we structure apps to get appropriate information where we need it?
  //(not like this)
  media.getListVideos().then(vids => {
    setAvailableVideos(vids);
  });
  const [video, setVideo] = React.useState(props.currentVideo);
  //const video = props.currentVideo;
  const handleChoose = (n: string) => {
    setVideo(n);
    props.setFilename(n);
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
