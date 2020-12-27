import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import SettingsIcon from '@material-ui/icons/Settings';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { mediaLib } from '../medialib'
import { observer } from 'mobx-react'

const MediaConfig = observer( function MediaConfig() {
  const [open, setOpen] = React.useState(false);
  //keep state of path local, so if we cancel it doesn't change anything.
  const [path, setPath] = React.useState(mediaLib.mainAssetPath!);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    mediaLib.setMainAssetPath(path);
    handleClose();
  }

  return (
    <div>
      <IconButton aria-label="media-config" onClick={handleClickOpen} ><SettingsIcon /></IconButton>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Where are your files?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the root directory of a tree where you want the app to search for videos.
            Probably don't point it anywhere with any very sensitive private data as
            there's a remote chance it ends up being accessible from the wider Internet (at some point
            more thought should be put into security).
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="main asset path"
            type="path"
            defaultValue={path}
            onChange={e=>setPath(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default MediaConfig;