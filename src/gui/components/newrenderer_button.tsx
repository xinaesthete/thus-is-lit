import React from 'react';
import Button from '@material-ui/core/Button';

// let's make a button that creates a renderer...
// and then very soon refactor this code somewhere sensible.

async function makeLight() {
  //send a message to the server asking for a renderer to be created.
  await fetch('http://localhost:8321/newRenderer')
}

export default function NewRendererButton() {
  return (
    <Button variant="contained" color="primary" onClick={makeLight}>
      is this it?
    </Button>
  );
}

