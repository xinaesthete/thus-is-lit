import { 
  Accordion, AccordionSummary, AccordionDetails, Typography, Button, IconButton
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import PlayArrow from '@material-ui/icons/PlayArrow'
import React, { Profiler } from 'react'
import { AbstractImageDecriptor, VideoDescriptor } from '@common/media_model'
import { useStyles } from '../theme'
import AbstractImageController from './video/abstract_image_controller'
import { observer } from 'mobx-react'
import { action, trace } from 'mobx'
import MutatorGrid from './mutator/MutatorGrid'
import { useKaleid, useLitConfig } from '@gui/kaleid_context'
import KaleidComponent from './kaleid_component'
import SliderBank from './uniforms_gui';
import mediaLib, { niceName } from '@gui/medialib'
import { sendParameterValue, sendRefreshVideoElement } from '@gui/gui_comms'
import { isNum } from '@common/tweakables'

const SetNeutral = () => {
    const k = useKaleid();
    return <Button onClick={(e) => {
        k.model.setNeutral();
        e.stopPropagation();
        e.preventDefault();
    }}>fx off</Button>
}
const PreviousVidButton = () => {
    const k = useKaleid();
    const config = useLitConfig();
    return <IconButton onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        //fadeout first... then maybe pause?
        //add config flags for these.
        const mix = k.parmMap.get('OutputMult');
        if (mix) action(()=> {
            if (config.transitionFadeOut) {
                mix.value = 0;
                sendParameterValue(mix, k.model.id);
            }
        })();
        //or make fadeout something to do first?
        const prevUrl = k.vidState.vidUrl;
        const newUrl = mediaLib.choosePrevious(prevUrl);
        const desc = await mediaLib.getDescriptorAsync(newUrl);
        if (!desc) {
            console.error(`no descriptor for ${newUrl}?`);
        } else {
            action(()=>k.model.imageSource = desc)();
            sendRefreshVideoElement();
            mediaLib.getSidecar(newUrl).then(action((m) => {
                //// October 2021 - code consolidated into one action
                //// this change was made months ago & not comitted - seems an improvement?
                //// but I'm out of this headspace as of this writing.
                //// actually, seems maybe *not* an improvement. This is slow and buggy.
                // k.model.imageSource = desc;
                // sendRefreshVideoElement(); //this really wants to happen after the action? which should be made differently.
                if (m) {
                    console.log('applying loaded values...');
                    k.applyTweakables(m);
                } else {
                    if (config.transitionDefaults) k.applyDefaults();
                }
                if (config.transitionPause) (desc as VideoDescriptor).paused = true;
            }));
        }
    }}><SkipPreviousIcon /></IconButton>
}
const NextVidButton = () => {
    const k = useKaleid();
    const config = useLitConfig();
    return <IconButton onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        //fadeout first... then maybe pause?
        //add config flags for these.
        const mix = k.parmMap.get('OutputMult');
        if (mix) action(()=> {
            if (config.transitionFadeOut) {
                mix.value = 0;
                sendParameterValue(mix, k.model.id);
            }
        })();
        //or make fadeout something to do first?
        const prevUrl = k.vidState.vidUrl;
        const newUrl = mediaLib.chooseNext(prevUrl);
        const desc = await mediaLib.getDescriptorAsync(newUrl);
        if (!desc) {
            console.error(`no descriptor for ${newUrl}?`);
        } else {
            action(()=>k.model.imageSource = desc)();
            sendRefreshVideoElement();
            //how about applying default / 'no fx' in this case?
            mediaLib.getSidecar(newUrl).then(action((m) => {
                // k.model.imageSource = desc;
                // sendRefreshVideoElement(); //this really wants to happen after the action? which should be made differently.
                if (m) {
                    console.log('applying loaded values...');
                    k.applyTweakables(m);
                } else {
                    if (config.transitionDefaults) k.applyDefaults();
                }
                if (config.transitionPause) (desc as VideoDescriptor).paused = true;
            }));
        }
    }}><SkipNextIcon /></IconButton>
}
const StartScene = () => {
    const k = useKaleid();
    const go = action(() => {
        //play, set OutputMult
        const mix = k.parmMap.get('OutputMult');
        //alert(mix!.value);
        if (mix) {
            mix.value = 1;
            sendParameterValue(mix, k.model.id);
            (k.model.imageSource as VideoDescriptor).paused = false;
        };
    });
    return <IconButton onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        go();
    }}>
        <PlayArrow />
    </IconButton>
}
/** this is actually a fairly generic GUI for making a bunch of sliders for tweakable values.
 * Hopefully soon we'll reason about what different types of models we want,
 * and both how to make more explicitly designed GUIs for something like Kaleid, also what more
 * flexible dynamic models might look like.
 */
export default observer(() => {
  //also, https://mobx.js.org/react-optimizations.html
  const classes = useStyles();
  const kaleidContext = useKaleid();
  const k = kaleidContext;

  //--> ImageContext? What if there are multiple layers later?
  // then the context interface can change. KaleidContext can be used in place, anyway.
  // should this be a hook?
  const handleSetImage = action((newImg: AbstractImageDecriptor) => {
      //console.log(`handleSetImage`);
      k.model.imageSource = newImg; //still needed to trigger reaction
      //(although could be done via context deep in the hierarchy)
  });
  const name = React.useMemo(() => {
      return niceName((k.model.imageSource as VideoDescriptor).url);
  }, [k.model.imageSource]);

  const [mutateMode, setMutator] = React.useState(false);
  const tweaker = React.useMemo(()=> {
      if (mutateMode) return <MutatorGrid />;
      return (
        <SliderBank />
      );
  }, [mutateMode]);
  return (
      <div className={classes.uniformsGui}>
      <Accordion TransitionProps={{unmountOnExit: true, timeout: 50}}>
          <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel{model.id}-content" 
              id="panel{model.id}-header"
          >
              <Typography style={{paddingRight: '2em', alignSelf: 'center'}}>Renderer {k.model.id}:</Typography>
              <KaleidComponent name="header preview" />
              <KaleidComponent name="header previs" previs={true} />
              <SetNeutral />
              <PreviousVidButton />
              <NextVidButton />
              <StartScene />
              <Typography style={{paddingRight: '2em', alignSelf: 'center'}}>{name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <div>
              <AbstractImageController image={k.model.imageSource} setImage={handleSetImage} />
              <KaleidComponent name="outputPreview" outputPreview={true} />
              <Button onClick={()=>setMutator(!mutateMode)}>
                  {mutateMode ? "mutator" : "sliders"}
              </Button>
              {tweaker}
          </div>
          </AccordionDetails>
      </Accordion>
      </div>
  )
});
