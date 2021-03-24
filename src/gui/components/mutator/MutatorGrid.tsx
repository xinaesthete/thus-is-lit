import { KaleidContext } from "@gui/kaleid_context";
import { Grid } from "@material-ui/core";
import React from "react";


export default function MutatorGrid() {
  return (
    <KaleidContext.Consumer>
      {(model) => (
        <Grid container spacing={1}></Grid>
      )}
    </KaleidContext.Consumer>
  )
}

