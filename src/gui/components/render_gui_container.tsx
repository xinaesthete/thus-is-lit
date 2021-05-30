import { 
  Accordion, AccordionSummary, AccordionDetails, Typography, Button, IconButton
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SkipNextIcon from '@material-ui/icons/SkipNext'
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
import mediaLib from '@gui/medialib'
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
  const handleSetImage = action((newImg: AbstractImageDecriptor) => {
      //console.log(`handleSetImage`);
      k.model.imageSource = newImg; //still needed to trigger reaction
      //(although could be done via context deep in the hierarchy)
  });

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
              {/* <KaleidComponent name="header preview" />
              <KaleidComponent name="header previs" previs={true} /> */}
              <SetNeutral />
              <NextVidButton />
          </AccordionSummary>
          <AccordionDetails>
          <div>
              <AbstractImageController image={k.model.imageSource} setImage={handleSetImage} />
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
