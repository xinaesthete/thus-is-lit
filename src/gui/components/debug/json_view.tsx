import React, { useEffect, useState } from 'react'
import { Button, createStyles, makeStyles, Theme, Typography } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { httpURL } from '@common/network_addresses';
import { observer } from 'mobx-react';

const useTreeLabelStyles = makeStyles((theme: Theme) => createStyles({
    labelRoot: {
        display: 'flex',
        alignItems: 'center'
    },
    labelText: {
        fontWeight: 'inherit',
        flexGrow: 1
    }
}));
interface JsonViewProps {
    data: any;
    name: string;
}

export const HostView = observer(() => {
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

    return (
        <>
        <Button onClick={update}>refresh JSON</Button>
        <JsonViewGeneric data={data} name="host state" />
        </>
    )
});
/** Show a tree-view of any given `data` under a root-node `name`.
 * Originally for JSON, but would be nice to able to represent things like `Map`.
 * It would be good to have some more proper serialization (serializr?), 
 * which won't live here. Might try to revisit `Map`.
 */
const JsonViewGeneric = observer(function JsonViewGeneric_(props: JsonViewProps) {
    const classes = useTreeLabelStyles();

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
                hasChildren(node) ? 
                //node instanceof Map ? [...(node as Map<any, any>).entries()].map((map_k, map_v) => renderTree(map_v, map_k.toString())) :
                Object.keys(node).map((key) => renderTree(node[key], key)) : ''
            }
            </TreeItem>
        )
    };
    const tree = React.useMemo(()=>renderTree(props.data, props.name), [props.data]);

    return (
        <>
        <TreeView defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}>
        {tree}
        </TreeView>
        {/* <pre>{data}</pre> */}
        </>
    )
});
export default JsonViewGeneric;