import React, { useEffect, useState } from 'react'
import { Button } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { httpURL } from '../../../common/constants';

export default function JsonView() {
    const [data, setData] = useState({waiting: '...'});
    
    const update = () => {
        fetch(`${httpURL}/getJsonState`).then(async (val) => {
            setData(await val.json());
        });
    };
    
    useEffect(update);

    let i=0;
    //https://www.marklogic.com/blog/recursively-transform-json/
    //node types for JSON (in XPath or something?):
    //document-node, object-node, array-node, number-node, boolean-node, null-node, and text.
    //in js typeof node: 
    //'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'
    //however, I can be more lazy than that in checking recursion logic
    //hypothesis being that Object.keys() of any leaf apart from string will be []
    const recurseNode = (node: any) => { 
        return node !== undefined && node !== null && typeof node !== 'string';
    }
    const renderTree = (node: any, k: string) => {
        return (
            <TreeItem key={i} nodeId={"_" + i++} label={k}>
            {
                //note Object.keys of string returns indices / stackoverflow
                recurseNode(node) ? Object.keys(node).map((key) => renderTree(node[key], key)) : ''
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
