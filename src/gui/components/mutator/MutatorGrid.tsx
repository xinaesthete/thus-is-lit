import { Specimen, baseSpecimen, breed, GeneDef } from "@common/mutator";
import { Numeric } from "@common/tweakables";
import { useKaleid } from "@gui/kaleid_context";
import { useAnimationFrame } from "@gui/react_animate";
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
  const variantsRef = React.useRef(variants);
  const [mutationRate] = React.useState(1);
  const filter = (g: GeneDef)=> g.tags?.includes('geometry') || false;
  React.useEffect(()=> {
    const newVariants: Specimen[] = [...variants];
    for (let i=0; i<5; i++) {
      //mutate a new variant and add it to the list of variants
      //actually, they want to have other data associated, like 'picked' flag
      //just vaguelly sketching out now & moving on to other things.
      newVariants.push(breed(variants, mutationRate, filter));
    }
    setVariants(newVariants);
    variantsRef.current = newVariants;
  }, []);
  // React.useEffect(()=>{
  //   variantsRef.current = variants;
  // }, [variants]);
    
  useAnimationFrame(action((dt)=> {
    const a = Math.pow(0.0001, dt/10000);
    variantsRef.current.forEach((v, i)=> {
      if (v.active) v.weight += 0.01;
      v.weight *= a;
      if (v.weight < 0.5) {
        // const newVariants = [...variantsRef.current];
        // newVariants[i] = breed(variants, mutationRate, filter);
        // setVariants(newVariants);
        // variantsRef.current = newVariants;
      }
    });
  }));


  const children = React.useMemo(()=>variants.map((spec,i) => {
    return (<MutatorCell spec={spec} key={i}/>)
  }), [variants]);

  return (
    <GridList cols={3} cellHeight='auto' className={classes.mutatorGrid} >
      {children}
    </GridList>
  )
})

