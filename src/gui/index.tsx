import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';

// let's make a button that creates a renderer...
// and then very soon refactor this code somewhere sensible.

function makeLight() {
  //send a message to the server asking for a renderer to be created.
}

function App() {
  return (
    <Button variant="contained" color="primary" onClick={makeLight}>
      thus is lit.
    </Button>
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

