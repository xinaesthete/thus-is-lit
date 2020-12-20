import React from 'react';
import ReactDOM from 'react-dom';
// import { Threact } from '../common/threact/threact';
// import { DefaultCube } from '../common/threact/threexample';
import RendererControl from './components/renderer_control'

function App() {
  // const cube = new DefaultCube();
  return (
<>
    <RendererControl />
    {/* <DefaultCube /> */}
    {/* <Threact gfx={cube} /> */}
</>    
    
    
    //settings: media base path.
    //browse media
    
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));

