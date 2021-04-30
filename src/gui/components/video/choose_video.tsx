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
  //TODO options for advance to next video in sequence / random after it finishes.
  const url = encodeURI(props.video.url); //would probably rather it was kept encoded.
  
  const notNice = `${httpURL}/video/`.length;
  const niceName = (v: string) => (v.length > notNice) ? decodeURI(v.substring(notNice)) : v;
  //TODO: benchmark useMemo() vs not. maybe do things differently anyway.
  const availableMenu = React.useMemo(() => mediaLib.availableVideos.map(v => (
     <MenuItem key={v} value={v}>{niceName(v)}</MenuItem> 
     )), [mediaLib.availableVideos]);
  return (
    <>
      <Select className={classes.vidDropdown} label="video file" value={url} 
        onChange={e=>props.setURL(e.target.value as string)}>
        {availableMenu}
      </Select>
    </>
  )
});
