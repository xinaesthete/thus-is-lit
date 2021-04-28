import { Specimen, baseSpecimen, breed } from "@common/mutator";
import { Numeric } from "@common/tweakables";
import { KaleidContext } from "@gui/kaleid_context";
import { GridList } from '@material-ui/core'
import React from "react";
import MutatorCell from "./MutatorCell";


export default function MutatorGrid() {
  const kaleid = React.useContext(KaleidContext).model;
  const [variants, setVariants] = React.useState([baseSpecimen(kaleid)]);
  const [mutationRate] = React.useState(1);
  React.useEffect(()=> {
    const newVariants: Specimen[] = [...variants];
    for (let i=0; i<5; i++) {
      //mutate a new variant and add it to the list of variants
      //actually, they want to have other data associated, like 'picked' flag
      //just vaguelly sketching out now & moving on to other things.
      newVariants.push(breed(variants, mutationRate));
    }
    //"invalid hook call. Hooks can only be called from the body of a function."
    setVariants(newVariants);
  }, []);

  const children = React.useCallback(()=>variants.map((spec,i) => {
    return (<MutatorCell spec={spec} key={i}/>)
  }), [variants]);

  return (
    <GridList cols={4} cellHeight='auto' >
      {children()}
    </GridList>
  )
}

