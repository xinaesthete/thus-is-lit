import { observer } from 'mobx-react';
import { ConnectionStatus } from '@gui/gui_comms';
import React from 'react';

export default observer(() => {
  return <p>websocket {ConnectionStatus.websocketConnected ? '' : 'dis'}connected</p>
});