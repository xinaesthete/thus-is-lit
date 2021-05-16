import React, { useEffect, useState } from 'react'
import { Button, createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { httpURL } from '@common/network_addresses';

const useTreeLabelStyles = makeStyles((theme: Theme) => createStyles({
    labelRoot: {
        display: 'flex',
        alignItems: 'center'
    },
    labelText: {
        fontWeight: 'inherit',
        flexGrow: 1
    }
}))


export default function JsonView() {
    const classes = useTreeLabelStyles();
    const [data, setData] = useState({waiting: '...'});
    const [updateTime, setUpdateTime] = useState(Date.now());
    
    const update = () => {
        setUpdateTime(Date.now());
        fetch(`${httpURL}/getJsonState`).then(async (val) => {
            setData(await val.json());
        });
    };
    
    useEffect(()=> {
        if (Date.now()-updateTime > 1000) update()
    });

    let i=0;
    //https://www.marklogic.com/blog/recursively-transform-json/
    //node types for JSON (in XPath or something?):
    //document-node, object-node, array-node, number-node, boolean-node, null-node, and text.
    //in js typeof node: 
    //'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'
    const hasChildren = (node: any) => { 
        return (node !== undefined && node !== null) && typeof node == 'object';
    }
    //"Cannot read property 'align' of undefined in Typography2??"
    //boolean => string seems to fix it.
    //not a fan of React stacktraces, must get devtools sorted out.
    const str = (node: any) => {
        if (typeof node == 'boolean') return node ? 'true' : 'false';
        else return node;
    }
    const renderLeaf = (node: any, k: string) => (
            <div className={classes.labelRoot}>
            <Typography className={classes.labelText}>{k}</Typography>
            <Typography variant='caption'>{str(node)}</Typography>
            </div>
    );
    const renderTree = (node: any, k: string) => {
        return (
            <TreeItem key={i} nodeId={"_" + i++} label={hasChildren(node) ? k : renderLeaf(node, k)}>
            {
                //note Object.keys of string returns indices / stackoverflow
                //also, this traverses the whole tree, maybe when things get complex we should be a bit more lazy.
                hasChildren(node) ? Object.keys(node).map((key) => renderTree(node[key], key)) : ''
            }
            </TreeItem>
        )
    };
        
    return (
        <>
        <Button onClick={update}>refresh JSON</Button>
        <TreeView defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}>
        {renderTree(data, 'host state')}
        </TreeView>
        {/* <pre>{data}</pre> */}
        </>
    )
}
