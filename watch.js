const { build } = require('esbuild');
const liveServer = require('live-server');
const chokidar = require('chokidar');

async function watch(name, node=false) {
    console.log(`[${new Date()}] building ${name}, node=${node}`);
    // what do we need to do so that it understands where to find node_modules?
    // for now I've added a file /electron-launch.js, I think it is actually redundant
    // *** what I need to do is make sure electron is treated as external ***
    const builder = await build({
        color: true,
        platform: node ? "node" : "browser",
        external: ["electron", "fsevents"],
        entryPoints: [`./src/${name}/index.tsx`],
        outfile: `./public/${name}.js`,
        minify: true,
        bundle: true,
        sourcemap: true,
        define: {
            "process.env.NODE_ENV": '"development"'
        },
        // tsconfig: './tsconfig.json',
        logLevel: 'error',
        incremental: true,
        loader: { '.glsl': 'text' }
    });
    chokidar.watch(`src/${name}/**/*`).on('all', () => {
        console.log(`[${new Date()}] rebuilding ${name}`);
        builder.rebuild();
    });
}

(async () => {
    //seems like it'd be pretty easy to add something so this script could be watched / watch itself...
    watch('renderer');
    watch('gui');
    watch('server', true);
    liveServer.start({
        root: 'public',
        open: false,
    });
})();
