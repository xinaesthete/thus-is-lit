import React from 'react';
import JsonView from './json_view';
import QRCode from 'qrcode.react';
import { remoteGuiURL, rendererApiURL } from '@common/network_addresses';
import { Typography, Switch, FormGroup, FormControlLabel } from '@material-ui/core';
import ConnectionStatus from './connection_status';
import { observer } from 'mobx-react';
import { useLitConfig } from '@gui/kaleid_context';
import { action } from 'mobx';


const QR: React.FC<{url: string, name: string}> = ({...props}) => {
    const {url, name} = props;
    return (
        <>
            <h1>Connect {name}:</h1>
            <Typography>{url}</Typography>
            <br />
            <a href={url} target='_blank'>
            <QRCode value={url} level="M" />
            </a>
        </>
    )
};

const FeatureSwitches = observer(() => {
    const config = useLitConfig();
    
    return (
    <FormGroup>
        <FormControlLabel control={
            <Switch checked={config.livePreviews} onChange={action((e)=>config.livePreviews = e.target.checked)} />
        }
        label="Embedded graphics in GUI"/>
        <FormControlLabel control={
            <Switch checked={config.enableVideoStreamInput} onChange={action((e)=>config.enableVideoStreamInput = e.target.checked)} />
        }
        label="Allow selection of video stream inputs"/>
        <FormControlLabel control={
            <Switch checked={config.enableSpecialWidgets} onChange={action((e)=>config.enableSpecialWidgets = e.target.checked)} />
        }
        label="Use 'special widgets' where specified"/>
        
    </FormGroup>);
});

export default function DebugPanel() {
    return (
        <>
        <FeatureSwitches />
        <ConnectionStatus />
        <JsonView />
        <br />
        <QR url={remoteGuiURL} name='GUI' />
        <QR url={rendererApiURL} name='renderer' />
        </>
    )
}