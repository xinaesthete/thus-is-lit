import React from 'react'
import MediaConfig from './media_config'

//-------
//I'm still a bit sketchy on how to handle state
//there's actually very little reason that other parts of the system need to see this.
//In fact, we don't even need it here, it can just be in media_config.
//
//let fileConfig: FileConfigPrefs;
//-------

//layout etc TBD...
//could consider bringing something like this up as a Drawer when using <ChooseVideo />?
export default function MediaBrowser() {
    //const [availableVideos, setAvailableVideos] = React.useState()
    return (
        <>
            <MediaConfig />        
        </>
    )
}
