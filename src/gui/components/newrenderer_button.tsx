import React from 'react';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeLight } from '../gui_comms';
import { makeStyles, Theme } from '@material-ui/core';

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

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <Button variant="contained" color="primary" onClick={async ()=>{
          const m = await makeLight();
          setOpen(true);
        }}>
        is this it?
      </Button>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success">
          New renderer initialised.
        </Alert>
      </Snackbar>
    </div>
  );
}

