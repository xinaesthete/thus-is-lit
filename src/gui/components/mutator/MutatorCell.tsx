import { Numeric, Tweakable } from '@common/tweakables';
import React from 'react'
import { Button, GridListTile } from '@material-ui/core'
import { KaleidContext } from '@gui/kaleid_context';
import { action } from 'mobx';

/**
 * This should have a graphic representation of a particular parameter representation, 
 * and some buttons to mark as selected etc.
 * @param props 
 * @returns 
 */
export default function MutatorCell(props: {parms: Numeric[]}) {
    const kaleid = React.useContext(KaleidContext);
    //const [myModel, setMyModel] = React.useState(props.parms);
    const renderNum = (n: Numeric, i: number) => {
        const inner = typeof n === "number" ? n
            : `${n.x}, ${n.y}`;
        return (<li key={i}>{inner}</li>);
    }
    //mobx action
    const activate = action(() => {
        props.parms.forEach((p, index) => {
            kaleid.tweakables[index].value = p;
        })
    });
    return (
        <GridListTile>
            <Button onClick={activate}>Pick Me!</Button>
            {/* <ul>
                {
                props.parms.map(renderNum)
                }
            </ul> */}
        </GridListTile>
    )
}
