import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import SettingsIcon from '@material-ui/icons/Settings';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import mediaLib from '../medialib'
import { observer } from 'mobx-react'
import { requestFileDialog } from '../gui_comms';
import { useStyles } from '@gui/theme';

const MediaConfig = function MediaConfig() {
  const [open, setOpen] = React.useState(false);
  const [path, setPath] = React.useState(mediaLib.mainAssetPath!);
  const classes = useStyles();

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
    // handleSubmit(); //for some reason this doesn't work.
  }

  return (
    <div className={classes.mediaConfigHeader}>
      <IconButton aria-label="media-config" onClick={handleClickOpen} ><FolderIcon /></IconButton>
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
            value={path}
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
      <TextField label="filter" onChange={(e) => mediaLib.stringFilter(e.target.value)} />
    </div>
  );
};

export default MediaConfig;