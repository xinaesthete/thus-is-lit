import React from 'react'
import MediaConfig from './media_config'
import { GridList, GridListTile, GridListTileBar, CardMedia } from '@material-ui/core'
import { observer } from 'mobx-react'
import { mediaLib } from '../medialib'
import { useStyles } from '../theme'


const VideoCard = (url: string, classes: any) => {
    const name = decodeURI(url.replace(/.*video\//, ''));
    //todo: lazy video.
    return (
        <GridListTile key={url} cols={1}>
            <video src={url} className={classes.videoPreview} style={{width: '100%'}} />
            <GridListTileBar title={name} />
        </GridListTile>
    )
}


export default observer(function MediaBrowser() {
    const availableVideos = mediaLib.availableVideos;
    const classes = useStyles();
    return (
        <>
            <MediaConfig />
            <GridList cellHeight={200}>
                {availableVideos.map(VideoCard)}
            </GridList>
        </>
    )
});
