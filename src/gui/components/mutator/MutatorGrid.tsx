import { mutate } from "@common/mutator";
import { Numeric, Tweakable } from "@common/tweakables";
import { KaleidContext } from "@gui/kaleid_context";
import { GridList, GridListTile, GridListTileBar, CardMedia } from '@material-ui/core'
import React from "react";
import MutatorCell from "./MutatorCell";


export default function MutatorGrid() {
  const kaleid = React.useContext(KaleidContext);
  const [variants, setVariants] = React.useState([kaleid.tweakables.map(t => t.value)]);
  
  React.useEffect(()=> {
    const newVariants: Numeric[][] = [kaleid.tweakables.map(t => t.value)];
    for (let i=0; i<11; i++) {
      //mutate a new variant and add it to the list of variants
      //actually, they want to have other data associated, like 'picked' flag
      //just vaguelly sketching out now & moving on to other things.
      newVariants.push(mutate(kaleid.tweakables, 0.3));
    }
    //"invalid hook call. Hooks can only be called from the body of a function."
    setVariants(newVariants);
  }, []);

  const children = variants.map((parms,i) => {
    return (<MutatorCell parms={parms} key={i}/>)
  });

  return (
    <GridList cols={4} cellHeight='auto' >
      {children}
    </GridList>
  )
}

