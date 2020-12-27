import React, { useEffect } from 'react'
import produce from 'immer'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import * as media from '../../medialib'
import { httpURL } from '../../../common/constants'
import { useStyles } from '../../theme'


export default function ChooseVideo(props: { 
  //if this component only understands currentVideo as a string
  //other parts of the system (unreasonably as of now) expect things to be able to create
  //a fully formed representation... worse, in a couple of places I use 'as' probably badly.
  ////?? how about if we always *did* have the proper metadata??
  ////   if the server, when retrieving the relevant lists, also transmitted that...
  ////   would seem like it would be a lot heavier than just reading the filenames
  ////   might want more fully-fledged catalog at some point (in which case info cached)
  currentVideo: string, setURL: (url: string) => void,
  //  availableVideos: string[] //feels like we shouldn't have to pass this in as a prop.
}) {
  
  const classes = useStyles();
  const [availableVideos, setAvailableVideos] = React.useState([props.currentVideo]);
  useEffect(() => {
    media.getVideoList().then(vids => {
      setAvailableVideos(vids);
    });
  });
  //TODO options for advance to next video in sequence / random after it finishes.
  const [video, setVideo] = React.useState(props.currentVideo);
  const handleChoose = (n: string) => {
    setVideo(n); //consider resetting time as well...
    props.setURL(n);
  }
  console.log(`rendering <ChooseVideo currentVideo={${JSON.stringify(video)}} />`);
  
  const notNice = `${httpURL}/video/`.length;
  const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
  const availableMenu = availableVideos.map(v => ( <MenuItem key={v} value={v}>{niceName(v)}</MenuItem> ));
  return (
    <>
      <Select className={classes.vidDropdown} label="video file" value={video} 
        onChange={e=>handleChoose(e.target.value as string)}>
        {availableMenu}
      </Select>
    </>
  )
}
