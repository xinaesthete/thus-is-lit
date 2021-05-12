import {node} from './electron-vendors.config.json';
import path, {join} from 'path';
import { builtinModules } from 'module';
import visualizer from 'rollup-plugin-visualizer';
import {defineConfig} from 'vite';
import {loadAndSetEnv} from './loadAndSetEnv.mjs';

const PACKAGE_ROOT = path.resolve(__dirname, '../src/server');

/**
 * Vite looks for `.env.[mode]` files only in `PACKAGE_ROOT` directory.
 * Therefore, you must manually load and set the environment variables from the root directory above
 */
loadAndSetEnv(process.env.MODE, process.cwd());

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '@common/': join(PACKAGE_ROOT, '../common') + '/',
    },
  },
  build: {
    sourcemap: 'inline',
    target: `node${node}`,
    outDir: '../../public/server',
    assetsDir: '.',
    minify: process.env.MODE === 'development' ? false : 'terser',
    terserOptions: {
      ecma: 2020,
      compress: {
        passes: 2,
      },
      safari10: false,
    },
    lib: {
      entry: './index.tsx',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-updater',
        'express',
        'chokidar',
        'mediainfo.js',
        // 'socket.io', //https://github.com/socketio/socket.io/issues/3859
        'ws',
        ...builtinModules,
      ],
      plugins: [ visualizer({ open: true, filename: 'main_stats.html' }) ],
      output: {
        entryFileNames: 'server.js',
      },
    },
    emptyOutDir: true,
  },
});
