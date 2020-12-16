# thus-is-lit

Experimental system for multi-screen video projection and effects running in Electron.  If it works well, it is likely that in future other AV features (like SuperCollider synthesis stuff among other things related to visualisation / sonification / live-coding etc) will be added.  Initially developed for a live performance application, but also anticipated to be relevant to installations as well as collaborative workshops and web-based work.  I have long-standing hopes to write software for digital-asset-management (for instance of audio & 360 video files), some of which are immediately relevant/needed here, so future feature-creep may also extend further into that domain.

In early development stages... it should soon, with a little careful consideration, facilitate co-operation between networked devices to allow things like an iPad on a local network to control visuals on (potentially multiple) other machines performing rendering.

Fairly light on capabilities at time of writing.  If you want to understand how to use it, or how it's likely change, you probably have to speak to me directly.  Priority at this stage is to create a nice performance interface (eg a `Mutator` interactive genetic-algorithm paradigm) with ability to manage material to be used for a set-list.

As of now (who knows if I'll update this readme as I update features), running the app will launch a GUI controller window.  That window has a button that causes a new Renderer window to be created (this can be done an arbitrary number of times).  On my Windows system, I am having trouble with contention in video playback with multiple fullscreen windows when the `<video>` elements themselves aren't visible; for now, I've made the renderer windows borderless and manipulate their position with `[win]+[arrow]` keyboard shortcuts.

To get it running, you'd need to clone or otherwise download the code, install node and then `npm install` & `npm run launch` from the folder where the code lives.  Actually, the build code in `public/` will tend to be stale (need to figure out why map files are so huge), so best to run `npm run watch` before `launch`.

For development, `npm run watch` & refer to `src/readme.md`.