import {
  AppBar, CssBaseline, Tabs, Tab,
  Container
} from '@material-ui/core';
import React from 'react';
import ReactDOM from 'react-dom';
import { enableMapSet } from 'immer'
import { ThemeProvider } from '@material-ui/core/styles';
import theme, { useStyles } from './theme'
import DebugPanel from './components/debug/debug_panel';
import MediaBrowser from './components/media_browser';
import BugReportIcon from '@material-ui/icons/BugReport';
import SettingsIcon from '@material-ui/icons/Settings';
import { IconButton } from '@material-ui/core';

import { Threact } from '@common/threact/threact';
import { DefaultCube } from '@common/threact/threexample';
import RendererControl from '@gui/components/renderer_control'
import MediaConfig from '@gui/components/media_config';

enableMapSet();

enum AppTabs {
  Media, Renderer, Debug
}
// const cube = new DefaultCube();
function App() {
  const classes = useStyles(); //error? check console...
  // AppBar, Tabs, (Persistent)Drawer...
  const [tab, setTab] = React.useState(1 as AppTabs);
  // const cube = new DefaultCube(); //is now able to render, although not a good React citizen.

  //seems like it'd be more efficient to only render the tab we want to see,
  //but...
  //https://reactjs.org/docs/hooks-rules.html
  //"Don’t call Hooks inside loops, conditions, or nested functions."
  //they need to be called in the same order every time a component renders.
  //Not sure how happy I am about that, but good to know sooner rather than later.
  //I was trying to avoid unnecessary API calls in useEffects() for inactive tabs
  //const content = {0: MediaBrowser, 1: RendererControl, 2: DebugPanel}
  //const el = content[tab]();

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={classes.root}>
          <AppBar className={classes.appBar}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} aria-label="top navigation">
              <Tab label="media" />
              <Tab label="rendering" />
              <Tab label="debug" />
            </Tabs>
          </AppBar>
          <Container className={classes.content}>
            <div role="tabpanel" hidden={tab !== 0}><MediaBrowser /></div>
            <div role="tabpanel" hidden={tab !== 1}><RendererControl /></div>
            <div role="tabpanel" hidden={tab !== 2}><DebugPanel /></div>

            {/* <DefaultCube /> this isn't a component, it's an implementation of a type of prop that can be rendered... */}
            {/* <Threact gfx={cube} /> */}

          </Container>
        </div>
      </ThemeProvider>
    </>


    //settings: media base path.
    //browse media

  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

