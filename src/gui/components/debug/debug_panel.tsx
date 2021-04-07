import React from 'react'
import JsonView from './json_view'
import QRCode from 'react-qr-code'
import { guiURL } from '@common/constants';


export default function DebugPanel() {
    const url = guiURL;//`http://${location.host}/gui.html`; //ask for address of gui.html

    return (
        <>
        <JsonView />
        <br />
        <a href={url}>
        <QRCode value={url} />
        </a>
        </>
    )
}