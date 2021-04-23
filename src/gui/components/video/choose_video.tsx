import React from 'react'
import { observer } from 'mobx-react'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import mediaLib from '../../medialib'
import { httpURL } from '@common/constants'
import { useStyles } from '../../theme'
import { action } from 'mobx'
import { VideoDescriptor } from '@common/media_model'


export default observer( function ChooseVideo(props: { 
  video: VideoDescriptor, setURL: (url: string) => void,
}) {
  
  const classes = useStyles();
  const availableVideos = mediaLib.availableVideos;
  //TODO options for advance to next video in sequence / random after it finishes.
  const url = encodeURI(props.video.url); //would probably rather it was kept encoded.
  
  const handleChoose = action((n: string) => {
    //consider resetting time as well...
    props.setURL(n); //this ends up being async, so divorced from 'action' wrap above
    //but shouldn't matter, because once it gets down to actually mutating the model, it is another action.
  });
  
  const notNice = `${httpURL}/video/`.length;
  const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
  //TODO: benchmark useMemo() vs not. maybe do things differently anyway.
  const availableMenu = React.useMemo(() => availableVideos.map(v => (
     <MenuItem key={v} value={v}>{niceName(v)}</MenuItem> 
     )), [availableVideos]);
  return (
    <>
      <Select className={classes.vidDropdown} label="video file" value={url} 
        onChange={e=>handleChoose(e.target.value as string)}>
        {availableMenu}
      </Select>
    </>
  )
});
