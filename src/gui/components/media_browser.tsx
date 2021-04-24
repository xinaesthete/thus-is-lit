import React from 'react'
import MediaConfig from './media_config'
import { Button, GridList, GridListTile, GridListTileBar, Typography } from '@material-ui/core'
import { Pagination } from '@material-ui/lab'
import { observer } from 'mobx-react'
import mediaLib from '../medialib'
import { useStyles } from '../theme'
import { produce } from 'immer'
import { useKaleidList } from '@gui/kaleid_context'
import { VideoDescriptor } from '@common/media_model'

interface VidAssignerProps {
    url: string;
}

const useVidSource = (url: string) => {
    //can't really sensibly make a VideoDescriptor from limited info...
    //should be able to set URL without a big palavar anyway...
}

/** A set of buttons corresponding to each renderer output, to be displayed over a VideoTileInner. */
const VidAssigner = observer((props: VidAssignerProps) => {
    //context with list of renderers, such that we can add 'assign to renderer' buttons here.
    //may also consider keystrokes.
    const { renderModels } = useKaleidList();
    const classes = useStyles();
    return (
        <>
        {renderModels.map((m, i) => {
            return <p key={i}>{m.model.id}</p>
        })}
        </>
    )
});

const VideoTileInner = ({...props}) => {
    const { url } = props;
    const name = React.useMemo(()=>decodeURI(url.replace(/.*video\//, '')).split(/[\\/]/).reverse()[0], [url]);
    const classes = useStyles();
    const [t, setTime] = React.useState(0);
    
    return (
        <>
            <video src={url} className={classes.videoPreview}
                onMouseMove={(e) => {
                    const target = e.target as HTMLVideoElement;
                    const t = target.duration * e.nativeEvent.offsetX / target.clientWidth;
                    if (Number.isNaN(t)) return;
                    target.currentTime = t;
                    setTime(t);
                }}
            />
            {/* <VidAssigner url={url} /> */}
            <GridListTileBar title={name} subtitle={t}/>
        </>
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
    
    return (
        <>
            <MediaConfig />
            <GridList cellHeight='auto' cols={4} className={classes.videoGridList} >
                {displayedVideos.map((url) => {
                    return (
                        <GridListTile key={url} cols={1} className={classes.videoTile}>
                            <VideoTileInner url={url} />
                        </GridListTile>
                    )
                })}
            </GridList>
            <Pagination count={pageCount} page={page} onChange={(e, p) => setPage(p)} />
        </>
    )
});
