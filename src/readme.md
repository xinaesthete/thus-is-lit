# code layout

Each of these subfolders has an `index.tsx` which is relates to a convention of the way that the build script (`..\watch.js`) works at the time of writing.  **Just now only gui is expected to use react 'tsx' features**, although renderer might do too some day and I see no harm in using that filename.

## gui
React interface for controlling the app, keeping out of the way of graphics output (notwithstanding future live-coding configurations perhaps).

## renderer
Stuff related to rendering with WebGL.  In a dream future, there may even be native renderers,
perhaps with formally similar API (OSC message or maybe JSON/YAML based).  Native source-code wouldn't live here, though.  That future may become reality if stars align on performance in Electron being inadequate, and implementation of native not being too nightmarish (anticipated in cases with eg a lower powered device running renderer in an installation, or to get the best out of a more powerful system, or just because I feel like exercising my nerd-muscles to help them grow).

## server
Anything that needs to interact with the Electron or node API: filesystem, native sockets etc.  This includes `index.tsx` acting as the 'electron-main' responsible for creating windows, the server responsible for loading assets from filesystem, managing configuration etc. Relaying messages from gui to renderer may be through here, or maybe via direct gui WebSocket -> renderer (with this as a broker instructing them on what connections need to be established?).