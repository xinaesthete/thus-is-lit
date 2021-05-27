import { 
  Accordion, AccordionSummary, AccordionDetails, Typography, Button
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import React, { Profiler } from 'react'
import { AbstractImageDecriptor } from '@common/media_model'
import { useStyles } from '../theme'
import AbstractImageController from './video/abstract_image_controller'
import { observer } from 'mobx-react'
import { action, trace } from 'mobx'
import MutatorGrid from './mutator/MutatorGrid'
import { useKaleid } from '@gui/kaleid_context'
import KaleidComponent from './kaleid_component'
import SliderBank from './uniforms_gui';

const SetNeutral = () => {
    const k = useKaleid();
    return <Button onClick={(e) => {
        k.model.setNeutral();
        e.stopPropagation();
        e.preventDefault();
    }}>Neutral playback</Button>
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
      return <SliderBank />;
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
