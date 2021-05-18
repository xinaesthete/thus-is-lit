//https://material-ui.com/guides/server-rendering/
import { createMuiTheme, createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import cyan from '@material-ui/core/colors/cyan';
import pink from '@material-ui/core/colors/pink'

// Create a theme instance. (nb, this was hanging around, not doing anything now, but useStyles is)
// (don't have a strong sense of how the more complex hook-based one helps)

///// actually, I'm veering more towards specifying style locally for some things, 
///// this doesn't play nice with HMR, having to refresh entire GUI with each tweak.



const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: cyan[800],
      light: '#4fb3bf', //cyan[300],
      dark: cyan[900]
    },
    secondary: {
      main: pink[600],
      light: pink.A700,
      dark: '#a00037'
    }
  }
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
      maxWidth: 200,
      padding: theme.spacing(1)
    },
    vidDropdown: {
      margin: theme.spacing(2),
      marginRight: theme.spacing(4)
    },
    vidCtrlButton: {
      margin: theme.spacing(1)
    },
    mediaConfigHeader: {
      paddingBottom: theme.spacing(3)
    },
    videoGridList: {
    },
    videoTile: {
      display: 'flex', //was this getting through?
      //a <div class="MuiGridListTile-tile"> is created inside with display: block
      //maybe would be better off taking a less Material-UI centric approach
      //using flexbox more directly.
      maxHeight: '300px',
      justifyContent: 'center',
      alignItems: 'center'
    },
    vidAssigner: {
      position: 'absolute',
      top: '0px',
      right: '5px',
      color: 'cyan'
    },
    videoPreview: {
      display: 'flex',
      width: '100%',
      margin: 'auto',
      justifyContent: 'center',
      padding: 0,
      objectFit: 'contain' //the element is larger than its container, so this doesn't work
    },
    kaleidComponent: {
      width: '200px'
    },
    mutatorCell: {
      margin: '0.2em'
    },
    mutatorGrid: {

    }
  }),
);

