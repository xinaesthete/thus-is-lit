const { build } = require('esbuild');
const liveServer = require('live-server');
const chokidar = require('chokidar');

async function watch(name, node=false) {
    const builder = await build({
        color: true,
        platform: node ? "node" : "browser",
        entryPoints: [`./src/${name}/index.tsx`],
        outfile: `./public/${name}.js`,
        minify: true,
        bundle: true,
        sourcemap: true,
        // tsconfig: './tsconfig.json',
        logLevel: 'error',
        incremental: true,
        loader: { '.glsl': 'text' }
    });
    chokidar.watch(`src/${name}/**/*`).on('all', () => {
        console.log(`rebuilding ${name}`);
        builder.rebuild();
    });

    liveServer.start({
        root: 'public',
        open: false,
    });
}

(async () => {
    watch('renderer');
    watch('gui');
    watch('server', true);
})();
