import React from 'react'
import JsonView from './json_view'
import QRCode from 'react-qr-code'
import { guiURL } from '@common/constants';
import { Typography } from '@material-ui/core';
import ConnectionStatus from './connection_status';


export default function DebugPanel() {
    const url = guiURL;
    //qrcode is a bit slow, maybe impacting more than thought?
    return (
        <>
        <ConnectionStatus />
        <JsonView />
        <br />
        <Typography>{url}</Typography>
        <br />
        <a href={url}>
        <QRCode value={url} />
        </a>
        </>
    )
}