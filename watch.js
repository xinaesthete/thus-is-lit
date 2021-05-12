const { build } = require('esbuild');
const chokidar = require('chokidar');

///XXX: if you get an error about esbuild install scripts in console,
//run 'node node_modules/esbuild/install.js'...

// assuming that THREE is a global object,
// makes any imported reference to three proxy to that instead.
const threeShim = Object.keys(require("three")).map(k => `export const ${k} = window.THREE.${k}`).join('\n');

//https://esbuild.github.io/plugins/#using-plugins
const externaliseThreePlugin = {
    name: 'three',
    setup(build) {
        build.onResolve({ filter: /^three$/ }, args => ({
            path: args.path,
            // external: true,
            namespace: 'three-ns'
        }));
        build.onLoad({ filter: /.*/, namespace: 'three-ns' }, (args) => ({
            contents: threeShim,
            loader: 'js'
        }));
    }
}


async function watch(name, node=false) {
    console.log(`[${new Date()}] building ${name}, node=${node}`);
    // TODO: log errors / warnings / stats.
    const builder = await build({
        color: true,
        platform: node ? "node" : "browser",
        //may need a better approach to electron externals soon...
        //also... why am I getting several copies of three in my renderer bundle?!
        external: ["electron", "fsevents", "express", "mediainfo.js"],
        plugins: [externaliseThreePlugin], //this is not a keeper... but...
        entryPoints: [`./src/${name}/index.tsx`],
        outfile: `./public/esbuild/${name}.js`, //putting build artefacts here, adding to .gitignore and removing old file.
        //could do something like `git rm --cached `git ls-files -i -X .gitignore`` but I still want other files in public
        //and maintaining list of names in gitignore sounds fiddly.
        ///--- need to clarify what's going on with css ---
        
        minify: true,
        bundle: true,
        sourcemap: true,
        define: {
            "process.env.NODE_ENV": '"production"',
            "import.meta.env.DEV": 'false' //vite-like
        },
        tsconfig: './tsconfig.json',
        logLevel: 'warning',
        incremental: true,
        loader: { '.glsl': 'text' }
    });
    //nb, now using renderer code in gui, so just watching all src
    //in a way it'd make sense to make those files 'common'
    chokidar.watch([`src/**/*`], {ignoreInitial: true}).on('all', () => {
        console.log(`[${new Date()}] rebuilding ${name}`);
        try {
            builder.rebuild();
        } catch (error) {
            //note: we get UnhandledPromiseRejectionWarning from node when there's an error,
            //and trying to catch here does nothing AFAICT.
            console.log(`caught error '${error}' while rebuilding ${name}`);
        }
    });
}
(async () => {
    //seems like it'd be pretty easy to add something so this script could be watched / watch itself...
    watch('renderer');
    watch('gui');
    watch('server', true);
    //still haven't got live-reload working, should be good eventually...
    //handy to be able to see gui / renderer in browser and see how things work with basic server, but for interop we need our custom server.
    //might even consider putting most of this build logic into actual Electron script...
    ///// server is express running in electron.
    // liveServer.start({
    //     root: 'public',
    //     open: false,
    // });
})();
