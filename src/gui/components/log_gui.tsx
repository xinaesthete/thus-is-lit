import React from 'react';
import {Snackbar} from '@material-ui/core';

export const LogGuiContext = React.createContext({
  log(msg: string) {}
});

export const useLogGui = () => {
  //a global variable by any other name...
  return React.useContext(LogGuiContext);
};

export const LogGuiProvider = ({...props}) => {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [logger] = React.useState({
    log(msg: string) {
      setOpen(true);
      setText(msg);
      console.log(`[LogGui] ${msg}`);
    }
  });
  return (
    <>
    <LogGuiContext.Provider value={logger}>
      {props.children}
    </LogGuiContext.Provider>
    <Snackbar open={open} message={text} 
    autoHideDuration={1000} onClose={()=>setOpen(false)}
    />
    </>
  )
};
