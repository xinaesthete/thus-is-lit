# thus-is-lit

![thus is lit, based on Fireicon01 from wikimedia commons](litk.png)

Experimental system for multi-screen video projection and effects running in Electron.  If it works well, it is likely that in future other AV features (like SuperCollider synthesis stuff among other things related to visualisation / sonification / live-coding etc) will be added.  Initially developed for a live performance application, but also anticipated to be relevant to installations as well as collaborative workshops and web-based work.  I have long-standing hopes to write software for digital-asset-management (for instance of audio & 360 video files), some of which are immediately relevant/needed here, so future feature-creep may also extend further into that domain.

In early development stages... it should soon, with a little careful consideration, facilitate co-operation between networked devices to allow things like an iPad on a local network to control visuals on (potentially multiple) other machines performing rendering.

Fairly light on capabilities at time of writing.  Some of this is more notes-to-self / blog post-ish than useful description:  I'm trying to settle on an architecture for management of state and events, hopefully will manage to settle on an approach that is reasonably clear and efficient (in terms of not needing too much boilerplate littering the code, hot-reloading code changes without losing state, allowing other modular components to be easily encorporated, not wasting resources on the machine, and not being a source of bugs... oh my...).  I also don't want to overthink this too soon, so as long as there's a somewhat coherent pattern that can be refactored later and the system doesn't fall over, then I can get on with thinking about content.  At the same time, it's a central pillar around which the rest of the project is supported...

Being stuck in this loop is the story of my life.

If you want to understand how to use it, or how it's likely change, you probably have to speak to me directly. Priority at this stage is to create a nice performance interface (eg a [Mutator](https://youtu.be/OwL3dsFBxpE)-esque interactive genetic-algorithm paradigm) with ability to manage material to be used for a set-list.

As of now (who knows if I'll update this readme as I update features), running the app will launch a GUI controller window.  That window has a button that causes a new Renderer window to be created (this can be done an arbitrary number of times).  Some poorly-styled and non-functional (pending sorting state management) sliders appear.

On my Windows system, I am having trouble with contention in video playback with multiple fullscreen windows when the `<video>` elements themselves aren't visible; for now, I've made the renderer windows borderless and manipulate their position with `[win]+[arrow]` keyboard shortcuts.

To get it running, you'd need to clone or otherwise download the code, install node and then `npm install` & `npm run launch` from the folder where the code lives.  Actually, the build code in `public/` will tend to be stale (need to figure out why map files are so huge), so best to run `npm run watch` before `launch`.

For development, `npm run watch` & refer to `src/readme.md`.