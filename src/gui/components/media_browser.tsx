import React from 'react'
import MediaConfig from './media_config'
import { GridList, GridListTile, GridListTileBar, CardMedia } from '@material-ui/core'
import { observer } from 'mobx-react'
import { mediaLib } from '../medialib'
import { useStyles } from '../theme'
import { produce } from 'immer'

const VideoCard = (url: string, classes: any, 
        seekTimes: Map<string, number>, setSeekTimes: (newTimes: Map<string, number>)=>void) => {
    const name = decodeURI(url.replace(/.*video\//, ''));
    //const [t, setT] = React.useState(0); //can't use hook here.
    const setTime = (t: number) => {
        const newTimes = produce(seekTimes, draftState=> {
            draftState.set(url, t); //nb. needs immer 'enableMapSet()' on app start.
        });
        setSeekTimes(newTimes);
    }
    //todo: lazy video.
    return (
        <GridListTile key={url} cols={1}>
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
    const availableVideos = mediaLib.availableVideos;
    const classes = useStyles();
    const [seekTimes, setSeekTimes] = React.useState(new Map<string, number>());
    return (
        <>
            <MediaConfig />
            <GridList cellHeight={200} cols={4} >
                {availableVideos.map((v) =>VideoCard(v, classes, seekTimes, setSeekTimes))}
            </GridList>
        </>
    )
});
