import React from 'react';
import Button from '@material-ui/core/Button';
import { makeLight } from '../gui_comms';

export default function NewRendererButton() {
  return (
    <Button variant="contained" color="primary" onClick={makeLight}>
      is this it?
    </Button>
  );
}

