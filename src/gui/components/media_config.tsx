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
import { FileConfigPrefs } from '../../common/media_model';
import { requestFileConfigPrefs, requestSetMainAssetPath } from '../gui_comms';
import produce from 'immer';


export default function MediaConfig() {
  const [config, setConfig] = React.useState(null as FileConfigPrefs);
  //const [configSyncPending, setConfigSyncPending] = React.useState(false);
  if (!config) {
    //theoretically could get some crossed wires here, but hopefully not an issue
    // with a one-off component like this where the config itself very infequently changes.
    requestFileConfigPrefs().then(c => {
      setConfig(c);
      setPath(c.mainAssetPath);
    });
  }
  const [open, setOpen] = React.useState(false);
  //keep state of path local and only call update from parent when submit is pressed.
  const [path, setPath] = React.useState(config ? config.mainAssetPath : '');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    const newConf = produce(config, draftConfig => {
      draftConfig.mainAssetPath = path;
    });
    const ok = await requestSetMainAssetPath(path);
    if (ok) {
      setConfig(newConf);
      handleClose();
    } else {
      //error...
      alert(`failed to set config with path '${path}'`);
    }
  }
  const handleUpdate = (ev) => {
    setPath(ev.target.value); //must look into my lax tsconfig
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
            onChange={handleUpdate}
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
}

