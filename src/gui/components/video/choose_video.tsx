import React from 'react'
import { observer } from 'mobx-react'
import Select from '@material-ui/core/Select'
import IconButton from '@material-ui/core/IconButton'
import CasinoIcon from '@material-ui/icons/Casino'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import StarIcon from '@material-ui/icons/StarOutline'
import MenuItem from '@material-ui/core/MenuItem'
import mediaLib, { niceName } from '../../medialib'
import { useStyles } from '../../theme'
import { VideoDescriptor } from '@common/media_model'
// import { TextField } from '@material-ui/core'
import Fuse from 'fuse.js'
import { useLogGui } from '../log_gui'
import { starVideo } from '@gui/gui_comms'
import { useKaleid } from '@gui/kaleid_context'


export default observer( function ChooseVideo(props: { 
  video: VideoDescriptor, setURL: (url: string) => void,
}) {
  
  const classes = useStyles();
  // const {log} = useLogGui(); /// this is a bit broken just now
  //TODO options for advance to next video in sequence / random after it finishes.
  const url = encodeURI(props.video.url); //would probably rather it was kept encoded.
  const [filterText, setFilterText] = React.useState('');
  const availableMenu = React.useMemo(() => {
    const fuse = filterText ? new Fuse(mediaLib.filteredVideos, {ignoreLocation: true}) : null;
    const filterList = fuse ? fuse.search(filterText).map(r => r.item) : mediaLib.filteredVideos;
    // log(filterList.length + ' vis');
    return filterList.map(v => (
       <MenuItem key={v} value={v}>{niceName(v)}</MenuItem>
     ))
    }, [mediaLib.filteredVideos, filterText]
  );
  const random = () => {
    props.setURL(mediaLib.chooseRandom());
  };
  const next = () => {
    props.setURL(mediaLib.chooseNext(url));
  }
  const k = useKaleid(); //choose_video doesn't logically have this, but handy for starVideo now.
  return (
    <>
      <IconButton onClick={random}><CasinoIcon /></IconButton>
      <IconButton onClick={next}><SkipNextIcon /></IconButton>
      <Select className={classes.vidDropdown} label="video file" value={url} 
        onChange={e=>props.setURL(e.target.value as string)}>
        {availableMenu}
      </Select>
      <IconButton onClick={()=>starVideo(url, k.model)}><StarIcon /></IconButton>
      {/* <TextField label="filter" onChange={e=>setFilterText(e.target.value)} /> */}
    </>
  )
});
