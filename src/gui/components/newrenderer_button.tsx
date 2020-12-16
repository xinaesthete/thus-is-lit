import React from 'react';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeLight } from '../gui_comms';
import { makeStyles, Theme } from '@material-ui/core';
import KaleidModel from '../../common/KaleidModel'
import { KaleidGUI } from './uniforms_gui';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />
}
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}));

export default function NewRendererButton() {
  //should makeLight itself make something, or do we wrap it?
  //still not very fluent in react, basing on https://material-ui.com/components/snackbars/
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [model, setModel] = React.useState(undefined as KaleidModel);
  //const [renderers, addRenderer] = React.useState([] as KaleidModel[])

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const modelGui = (model === undefined) ? <></> : <KaleidGUI kaleid={model} />

  return (
      <>
      <Button variant="contained" color="primary" onClick={async ()=>{
          const m = await makeLight();
          setOpen(true);
          setModel(m);
        }}>
        is this it?
      </Button>
      {modelGui}
      <Snackbar open={open} autoHideDuration={1000} onClose={handleClose}>
        <Alert severity="success">
          New renderer initialised.
        </Alert>
      </Snackbar>
      </>
  );
}

