import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import SettingsIcon from '@material-ui/icons/Settings';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
//https://stackoverflow.com/questions/62935533/ho-to-fix-react-forwardrefmenu-material-ui
import {Dialog} from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import mediaLib from '../medialib'
import { observer } from 'mobx-react'
import { requestFileDialog } from '../gui_comms';
import ErrorBoundary from './debug/error_boundary';

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

  const handleOpenFileChooser = async () => {
    const result = await requestFileDialog();
    if (result === undefined) return;
    setPath(result);
    handleSubmit();
  }

  return (
    <div>
      <IconButton aria-label="media-config" onClick={handleClickOpen} ><SettingsIcon /></IconButton>
      <ErrorBoundary>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Where are your files?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the root directory of a tree where you want the app to search for videos.
          </DialogContentText>
          <IconButton aria-label="open-file-dialog" onClick={handleOpenFileChooser} ><FolderIcon /></IconButton>
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
      </ErrorBoundary>

    </div>
  );
});

export default MediaConfig;