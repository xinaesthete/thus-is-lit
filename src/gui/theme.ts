//https://material-ui.com/guides/server-rendering/
import { createMuiTheme, createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';

//TOOD:::


// Create a theme instance. (nb, this was hanging around, not doing anything now, but useStyles is)
// (don't have a strong sense of how the more complex hook-based one helps)
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;


//most of the stuff in here was copied from an example then not really used...
//pending making sense & styling things properly.

const drawerWidth = 240;

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      flexDirection: 'row'
    },
    content: {
      flexGrow: 1,
      marginTop: 40, //can't figure out interaction with appBar.
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      })
    },
    sliderContainer: {
      display: 'grid',
      //where does the magic number '12' for spacing come from?
      // gridTemplateColumns: 'repeat(24, 1fr)'
    },
    sliderLabel: {
      //
    },
    uniformsGui: {
      marginTop: theme.spacing(2)
    },
    slider: {
      // width: 350,
      maxWidth: 300
      // padding: theme.spacing(3)
    },
    vidDropdown: {
      margin: theme.spacing(2),
      marginRight: theme.spacing(4)
    }
  }),
);


