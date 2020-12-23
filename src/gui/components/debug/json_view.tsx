import { Button } from '@material-ui/core';
import React, { useEffect, useState } from 'react'
import { httpURL } from '../../../common/constants';

export default function JsonView() {
    const [data, setData] = useState('waiting...');
    
    const update = () => {
        fetch(`${httpURL}/getJsonState`).then(async (val) => {
            setData(await val.text());
        });
    };
    
    useEffect(update);

    
    return (
        <>
        <Button onClick={update}>refresh JSON</Button>
        <pre>{data}</pre>
        </>
    )
}
