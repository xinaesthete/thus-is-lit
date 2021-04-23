import React from 'react'
import JsonView from './json_view'
import QRCode from 'react-qr-code'
import { guiURL } from '@common/constants';
import { Typography } from '@material-ui/core';


export default function DebugPanel() {
    const url = guiURL;//`http://${location.host}/gui.html`; //ask for address of gui.html
    //qrcode is a bit slow, maybe impacting more than thought?
    return (
        <>
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