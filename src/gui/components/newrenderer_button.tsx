import React from 'react';
import Button from '@material-ui/core/Button';
import {port, newRenderer} from '../../common/constants'
// let's make a button that creates a renderer...
// and then very soon refactor this code somewhere sensible.

async function makeLight() {
  //send a message to the server asking for a renderer to be created.
  //who should be responsible for keeping track of which renderers are around, associated with with GUI?
  //*probably really needs to be the server* that is the only way that we can ensure integrity.
  console.log(`requesting newRenderer...`);
  //TODO: consider server not on localhost.
  const response = await fetch(`http://localhost:${port}${newRenderer}`);
  const info = response.json();
  console.log(`newRenderer response received: \n${JSON.stringify(info, null, 2)}`);
}

export default function NewRendererButton() {
  return (
    <Button variant="contained" color="primary" onClick={makeLight}>
      is this it?
    </Button>
  );
}

