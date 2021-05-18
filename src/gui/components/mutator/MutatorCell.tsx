import { Numeric, Tweakable } from '@common/tweakables';
import React from 'react'
import { Button, GridListTile, GridListTileBar } from '@material-ui/core'
import { useKaleid } from '@gui/kaleid_context';
import { action } from 'mobx';
import KaleidComponent from '../kaleid_component';
import { useStyles } from '@gui/theme';
import { Specimen } from '@common/mutator';
import { sendModel } from '@gui/gui_comms';
import { observer } from 'mobx-react';

/**
 * This should have a graphic representation of a particular parameter representation, 
 * and some buttons to mark as selected etc.
 * @param props 
 * @returns 
 */
export default observer(function MutatorCell(props: {spec: Specimen}) {
    const classes = useStyles();
    //consider having a property for aspect ratio, 
    //such that these can properly reflect the shape of the renderer
    const kaleidContext = useKaleid();
    const activate = action(() => {
        // console.log('calling activate in MutatorCell');
        props.spec.genes.forEach((p, t) => {
            t.value = p; //this should be better for not getting indices mixed up?
            //kaleid.tweakables[index].value = p;
        });
        props.spec.active = true;
        sendModel(kaleidContext.model);
    });
    //TODO: add a 'weight' representation & do some funky stuff with mutation
    /////XXX: when I had {props.spec.weight} inside the <Button> it caused nasty glitches in the renderer
    ////// WTF???? that was A NASTY GLITCH. A completely isolated JS context disrupted as a side-effect of
    ////// ???? WHAT?????
    return (
        <GridListTile cols={1} className={classes.mutatorCell}>
            <KaleidComponent {...props} />
            <GridListTileBar actionIcon={
                <Button onClick={activate} onMouseEnter={activate}
                onMouseLeave={()=>props.spec.active=false}
                >select</Button>
            }
            />
        </GridListTile>
    )
})
