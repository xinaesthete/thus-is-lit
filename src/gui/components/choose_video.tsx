import React from 'react'
import produce from 'immer'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import * as media from '../medialib'

export default function ChooseVideo(props: { 
  currentVideo: string, setFilename: (filename: string) => void,
//  availableVideos: string[] //feels like we shouldn't have to pass this in as a prop.
}) {
  //const [path, setPath] = React.useState(props.currentVideo);
  /// all sorts of potential features here: autocomplete, drag-drop from media_browser
  // dropdown of all available files? now we're talking.
  //const availableVideos: string[] = [];
  console.log(`rendering <ChooseVideo currentVideo={"${props.currentVideo}"}`);
  
  //this is not how we write React components.
  const [availableVideos, setAvailableVideos] = React.useState([props.currentVideo]);
  media.getListVideos().then(vids => {
    setAvailableVideos(vids);
  });
  
  const availableMenu = availableVideos.map(v => ( <MenuItem value={v}>{v}</MenuItem> ));
  return (
    <>
      <Select label="video file" value={props.currentVideo} 
        onChange={e=>props.setFilename(e.target.value as string)}>
        {availableMenu}
      </Select>
    </>
  )
}
