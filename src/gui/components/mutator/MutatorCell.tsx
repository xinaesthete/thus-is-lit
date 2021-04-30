import { Numeric, Tweakable } from '@common/tweakables';
import React from 'react'
import { Button, GridListTile, GridListTileBar } from '@material-ui/core'
import { useKaleid } from '@gui/kaleid_context';
import { action } from 'mobx';
import KaleidComponent from '../kaleid_component';
import { useStyles } from '@gui/theme';
import { Specimen } from '@common/mutator';
import { sendModel } from '@gui/gui_comms';

/**
 * This should have a graphic representation of a particular parameter representation, 
 * and some buttons to mark as selected etc.
 * @param props 
 * @returns 
 */
export default function MutatorCell(props: {spec: Specimen}) {
    const classes = useStyles();
    //consider having a property for aspect ratio, 
    //such that these can properly reflect the shape of the renderer
    const kaleidContext = useKaleid();
    const activate = action(() => {
        props.spec.genes.forEach((p, t) => {
            t.value = p; //this should be better for not getting indices mixed up?
            //kaleid.tweakables[index].value = p;
            sendModel(kaleidContext.model);
        });
    });
    return (
        <GridListTile cols={1}>
            <KaleidComponent {...props} />
            <GridListTileBar actionIcon={
                <Button onClick={activate}>Pick Me!</Button>
            }
            />
        </GridListTile>
    )
}
