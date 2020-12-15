import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
// let's make a button that creates a renderer...
function App() {
  return (
    <Button variant="contained" color="primary">
      thus is lit.
    </Button>
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

