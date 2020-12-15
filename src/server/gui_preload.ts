// this could be a place to put some code we put into BrowserWindow options to set up electron context bridge...


// shall we expose an interface via context-bridge, or shall we use something like an express API (maybe not actually needing express)?
// optimal would may be to have both & use whatever best for particular scenario, 
// but if we have only one then it seems better to have a web server, which'll make it relatively easy to e.g. use an iPad as a controller.
// security could be an issue.

// or maybe what we do is *use OSC for all of this stuff*