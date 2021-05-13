import React from 'react'
import JsonView from './json_view'
import QRCode from 'react-qr-code'
import { guiURL, rendererApiURL } from '@common/constants';
import { Typography } from '@material-ui/core';
import ConnectionStatus from './connection_status';


const QR: React.FC<{url: string, name: string}> = ({...props}) => {
    const {url, name} = props;
    return (
        <>
            <h1>Connect {name}:</h1>
            <Typography>{url}</Typography>
            <br />
            <a href={url} target='_blank'>
            <QRCode value={url} />
            </a>
        </>
    )
};

export default function DebugPanel() {
    const url = guiURL;
    //qrcode is a bit slow, maybe impacting more than thought?
    return (
        <>
        <ConnectionStatus />
        <JsonView />
        <br />
        <QR url={guiURL} name='GUI' />
        <QR url={rendererApiURL} name='renderer' />
        </>
    )
}