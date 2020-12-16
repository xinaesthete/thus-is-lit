# code layout

Each of these subfolders (`common` being a slight anomaly... seems to be something like Model of MVC) has an `index.tsx` which relates to a convention of the way that the build script (`/watch.js`) works at the time of writing.  **Just now only gui is expected to use react 'tsx' features**, although renderer might do too some day and I see no harm in using that filename.

## gui
React interface for controlling the app, keeping out of the way of graphics output (notwithstanding future live-coding configurations perhaps).

## renderer
Stuff related to rendering with WebGL.  At the moment, this is a fairly fixed configuration of a little kaleidoscope renderer operating on a single still or video source.  It should understand how to respond to messages sent over websocket from the gui with changes to graphics parameters.  It is instatiated with a `?id=%d` URL parameter which relates to how GUIs & renderers are associated with each-other, and for housekeeping in the server etc.

Sooner or later the renderer should be capable of receiving more complex information about how it should be configured, perhaps for instance receiving blocks of shader code, descriptions of 3d scenes / video layers, maybe hydra/marching.js code, etc.

In a dream future, there may be native renderers, perhaps with formally similar API (OSC message or maybe JSON/YAML based).  Native source-code wouldn't live here, though.  That future may become reality if stars align on performance in Electron being inadequate, and implementation of native not being too nightmarish (anticipated in cases with eg a lower powered device running renderer in an installation, or to get the best out of a more powerful system, or just because I feel like exercising my nerd-muscles to help them grow).

## server
Anything that needs to interact with the Electron or node API: filesystem, native sockets etc.  This includes `index.tsx` acting as the 'electron-main' responsible for creating windows, the server responsible for loading assets from filesystem, managing configuration etc. Relaying messages from gui to renderer may be through here, or maybe via direct gui WebSocket -> renderer (with this as a broker instructing them on what connections need to be established?).

Should also be able to handle hot-reloading of GUI or Renderer, re-establishing connections & parameter values etc.  Note that this ought also apply to native renderers being rebuilt (indeed, in a previous project I found that rebuilding C++ called from a host application somewhat similar to this ended up being a less painful development UX than changing the JS; go figure).