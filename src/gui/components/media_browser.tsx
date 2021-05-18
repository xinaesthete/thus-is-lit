import React from 'react'
import MediaConfig from './media_config'
import { GridList, GridListTile, GridListTileBar, Button, IconButton } from '@material-ui/core'
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { Pagination } from '@material-ui/lab'
import { observer } from 'mobx-react'
import mediaLib, { shortName } from '../medialib'
import { useStyles } from '../theme'
import { useKaleidList } from '@gui/kaleid_context'
import { requestNewRenderer, sendVideoChange, starVideo } from '@gui/gui_comms'
import { VideoDescriptor } from '@common/media_model'
import { action } from 'mobx'
import { useLogGui } from './log_gui'

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
    const { url } = props;
    const { renderModels } = useKaleidList();
    const logger = useLogGui();
    const classes = useStyles();
    return (
        <div className={classes.vidAssigner}>
        {renderModels.map((m, i) => {
            //console.log(i);
            return <Button variant="contained" size="small" color="primary" style={{opacity: 0.6}} key={i} onClick={async () => {
                logger.log(`${shortName(url)} -> #${m.model.id}`);
                //TODO change the interface so this is *fast* (and more consistent)
                sendVideoChange(url, m.model.id);
                const desc = await mediaLib.getDescriptorAsync(url) as VideoDescriptor;
                action(()=>m.model.imageSource = desc);
            }}>{m.model.id}</Button>
        })}
        <Button variant="contained" size="small" color="primary" style={{opacity: 0.6}} onClick={(async () => {
            requestNewRenderer(url);
        })} name='new renderer output'>+</Button>
        </div>
    )
});

const VideoTileInner = ({...props}) => {
    const { url } = props;
    const name = React.useMemo(()=>shortName(url), [url]);
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
            <VidAssigner url={url} />
            <GridListTileBar title={name} actionIcon={
                <IconButton aria-label={`star ${url}`} onClick={()=>starVideo(url)}>
                    <StarBorderIcon />
                </IconButton>
            }/>
        </>
    )
}


export default observer(function MediaBrowser() {
    const classes = useStyles();
    const maxItems = 4*4;
    const availableVideos = mediaLib.filteredVideos;
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
