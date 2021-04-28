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

import RendererControl from './components/renderer_control'
import { KaleidListProvider } from './kaleid_context';
import { observer } from 'mobx-react';

enableMapSet();

enum AppTabs {
  Media, Renderer, Debug
}
const App = observer(function App() {
  const classes = useStyles();
  const [tab, setTab] = React.useState(AppTabs.Renderer);

  const el = React.useCallback(()=>{
    switch (tab) {
      case AppTabs.Media:
        return (<MediaBrowser />)
      case AppTabs.Renderer:
        return (<RendererControl />)
      case AppTabs.Debug:
        return (<DebugPanel />)
    }
  }, [tab]);

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
          <KaleidListProvider>
            <Container className={classes.content}>
              <div role="tabpanel" >{el()}</div>
            </Container>
          </KaleidListProvider>
        </div>
      </ThemeProvider>
    </>


    //settings: media base path.
    //browse media

  );
});

ReactDOM.render(<App />, document.querySelector('#app'));

