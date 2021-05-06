import { Specimen, baseSpecimen, breed } from "@common/mutator";
import { Numeric } from "@common/tweakables";
import { KaleidContext, useKaleid } from "@gui/kaleid_context";
import { useStyles } from "@gui/theme";
import { GridList } from '@material-ui/core'
import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import MutatorCell from "./MutatorCell";


export default observer(function MutatorGrid() {
  const classes = useStyles();
  const kaleid = useKaleid().model;
  const [variants, setVariants] = React.useState([baseSpecimen(kaleid)]);
  const [mutationRate] = React.useState(1);
  React.useEffect(()=> {
    const newVariants: Specimen[] = [...variants];
    for (let i=0; i<5; i++) {
      //mutate a new variant and add it to the list of variants
      //actually, they want to have other data associated, like 'picked' flag
      //just vaguelly sketching out now & moving on to other things.
      newVariants.push(breed(variants, mutationRate, (g)=>g.tags?.includes('geometry') || false));
    }
    //"invalid hook call. Hooks can only be called from the body of a function."
    setVariants(newVariants);
    
    //pending something more interesting...
    const interval = setInterval(action(()=> {
      newVariants.forEach(v => {
        v.weight += Math.random() - 0.5;
      });
    }), 100);

    return () => {
      clearInterval(interval);
    }
  }, []);

  const children = React.useMemo(()=>variants.map((spec,i) => {
    return (<MutatorCell spec={spec} key={i}/>)
  }), [variants]);

  return (
    <GridList cols={3} cellHeight='auto' className={classes.mutatorGrid} >
      {children}
    </GridList>
  )
})

