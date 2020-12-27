import React, { useEffect, useState } from 'react'
import { Button, createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { httpURL } from '../../../common/constants';

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
    const renderLeaf = (node: any, k: string) => (
            <div className={classes.labelRoot}>
            <Typography className={classes.labelText}>{k}</Typography>
            <Typography variant='caption'>{node}</Typography>
            </div>
    );
    const renderTree = (node: any, k: string) => {
        return (
            <TreeItem key={i} nodeId={"_" + i++} label={hasChildren(node) ? k : renderLeaf(node, k)}>
            {
                //note Object.keys of string returns indices / stackoverflow
                hasChildren(node) ? Object.keys(node).map((key) => renderTree(node[key], key)) : ''
            }
            </TreeItem>
        )
    };
    function render(node: any, key: string) {
        //open TreeItem label="key" key={i++}
        const el = (<TreeItem nodeId={"_" + i++} label={key}></TreeItem>)
        Object.keys(node).map(k => {
            const child = node[k];
            //is leaf? then the recursion will be quick and stack-overflowy.
            render(child, k);
        });
        //close TreeItem
    }
        
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
