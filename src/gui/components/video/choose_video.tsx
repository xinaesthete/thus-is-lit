import React from 'react'
import { observer } from 'mobx-react'
import Select from '@material-ui/core/Select'
import IconButton from '@material-ui/core/IconButton'
import CasinoIcon from '@material-ui/icons/Casino'
import MenuItem from '@material-ui/core/MenuItem'
import mediaLib, { niceName } from '../../medialib'
import { useStyles } from '../../theme'
import { VideoDescriptor } from '@common/media_model'
// import { TextField } from '@material-ui/core'
import Fuse from 'fuse.js'
import { useLogGui } from '../log_gui'


export default observer( function ChooseVideo(props: { 
  video: VideoDescriptor, setURL: (url: string) => void,
}) {
  
  const classes = useStyles();
  const {log} = useLogGui();
  //TODO options for advance to next video in sequence / random after it finishes.
  const url = encodeURI(props.video.url); //would probably rather it was kept encoded.
  const [filterText, setFilterText] = React.useState('');
  const availableMenu = React.useMemo(() => {
    const fuse = filterText ? new Fuse(mediaLib.filteredVideos, {ignoreLocation: true}) : null;
    const filterList = fuse ? fuse.search(filterText).map(r => r.item) : mediaLib.filteredVideos;
    log(filterList.length + ' vis');
    return filterList.map(v => (
       <MenuItem key={v} value={v}>{niceName(v)}</MenuItem> 
     ))
    }, [mediaLib.filteredVideos, filterText]
  );
  const random = () => {
    props.setURL(mediaLib.chooseRandom());
  };
  return (
    <>
      <IconButton onClick={random}><CasinoIcon /></IconButton>
      <Select className={classes.vidDropdown} label="video file" value={url} 
        onChange={e=>props.setURL(e.target.value as string)}>
        {availableMenu}
      </Select>
      {/* <TextField label="filter" onChange={e=>setFilterText(e.target.value)} /> */}
    </>
  )
});
