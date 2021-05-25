import {
  AppBar, CssBaseline, Tabs, Tab,
  Container
} from '@material-ui/core';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import theme, { useStyles } from './theme'
import DebugPanel from './components/debug/debug_panel';
import MediaBrowser from './components/media_browser';

import RendererControl from './components/renderers_control'
import { observer } from 'mobx-react';
import { LogGuiProvider } from './components/log_gui';

enum AppTabs {
  Media, Renderer, Debug
}
const App = observer(function App() {
  const classes = useStyles();
  const [tab, setTab] = React.useState(AppTabs.Renderer);

  const el = React.useMemo(()=>{
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
          <LogGuiProvider>
            <Container className={classes.content} maxWidth={false}>
              <div role="tabpanel" >{el}</div>
            </Container>
          </LogGuiProvider>
        </div>
      </ThemeProvider>
    </>


    //settings: media base path.
    //browse media

  );
});

ReactDOM.render(<App />, document.querySelector('#app'));

