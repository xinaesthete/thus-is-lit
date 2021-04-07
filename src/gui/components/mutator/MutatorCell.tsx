import { Numeric, Tweakable } from '@common/tweakables';
import React from 'react'
import { Button, GridListTile, GridListTileBar } from '@material-ui/core'
import { KaleidContext } from '@gui/kaleid_context';
import { action } from 'mobx';
import KaleidComponent from '../kaleid_component';
import { useStyles } from '@gui/theme';

/**
 * This should have a graphic representation of a particular parameter representation, 
 * and some buttons to mark as selected etc.
 * @param props 
 * @returns 
 */
export default function MutatorCell(props: {parms: Numeric[]}) {
    const classes = useStyles();
    const kaleid = React.useContext(KaleidContext).model;
    const activate = action(() => {
        props.parms.forEach((p, index) => {
            kaleid.tweakables[index].value = p;
        })
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
