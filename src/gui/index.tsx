import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import NewRendererButton from './components/newrenderer_button'
import { Snackbar } from '@material-ui/core';

function App() {
  return (
    //... how shall we make this do something in here?
    //I want a Snackbar and I want my GUI!
    <NewRendererButton />
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

