import React from 'react'
import MediaConfig from './media_config'
import { GridList, GridListTile, GridListTileBar } from '@material-ui/core'
import { Pagination } from '@material-ui/lab'
import { observer } from 'mobx-react'
import mediaLib from '../medialib'
import { useStyles } from '../theme'
import { produce } from 'immer'

const VideoCard = (url: string, classes: any, 
        seekTimes: Map<string, number>, setSeekTimes: (newTimes: Map<string, number>)=>void) => {
    const name = decodeURI(url.replace(/.*video\//, '')).split(/[\\/]/).reverse()[0];
    //const [t, setT] = React.useState(0); //can't use hook here.
    const setTime = (t: number) => {
        const newTimes = produce(seekTimes, draftState=> {
            draftState.set(url, t); //nb. needs immer 'enableMapSet()' on app start.
        });
        setSeekTimes(newTimes);
    }
    return (
        <GridListTile key={url} cols={1} className={classes.videoTile} >
            <video src={url} className={classes.videoPreview} style={{width: '100%'}}
                onMouseMove={(e) => {
                    const target = e.target as HTMLVideoElement;
                    const t = target.duration * e.nativeEvent.offsetX / target.clientWidth;
                    if (Number.isNaN(t)) return;
                    target.currentTime = t;
                    //setT(t);
                    setTime(t);
                }}
            />
            <GridListTileBar title={name} subtitle={seekTimes.get(url)}/>
        </GridListTile>
    )
}


export default observer(function MediaBrowser() {
    const classes = useStyles();
    const maxItems = 4*3;
    const availableVideos = mediaLib.availableVideos;
    const pageCount = Math.floor(availableVideos.length / maxItems);
    const [page, setPage] = React.useState(0);
    
    const startIndex = page*maxItems;
    const endIndex = Math.min(startIndex+maxItems, availableVideos.length);
    const displayedVideos = availableVideos.slice(startIndex, endIndex);
    
    //lifted from VideoCard because of hooks
    const [seekTimes, setSeekTimes] = React.useState(new Map<string, number>());

    return (
        <>
            <MediaConfig />
            <GridList cellHeight='auto' cols={4} className={classes.videoGridList} >
                {displayedVideos.map((v) => VideoCard(v, classes, seekTimes, setSeekTimes))}
            </GridList>
            <Pagination count={pageCount} page={page} onChange={(e, p) => setPage(p)} />
        </>
    )
});
