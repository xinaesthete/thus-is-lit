import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import NewRendererButton from './components/newrenderer_button'

function App() {
  return (
    <NewRendererButton />
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

