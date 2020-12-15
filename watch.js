const { build } = require('esbuild');
const liveServer = require('live-server');
const chokidar = require('chokidar');

async function watch(name, node=false) {
    console.log(`[${new Date()}] building ${name}, node=${node}`);
    // TODO: log errors / warnings / stats.
    const builder = await build({
        color: true,
        platform: node ? "node" : "browser",
        //may need a better approach to electron externals soon...
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
