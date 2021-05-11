/* eslint-env node */

import {chrome} from './electron-vendors.config.json';
import path from 'path';
import { builtinModules } from 'module';
import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import vitePluginString from 'vite-plugin-string';
import {loadAndSetEnv} from './loadAndSetEnv.mjs';

const PACKAGE_ROOT = path.resolve(__dirname, '../src/gui');
//const commonRoot = 
/**
 * Vite looks for `.env.[mode]` files only in `PACKAGE_ROOT` directory.
 * Therefore, you must manually load and set the environment variables from the root directory above
 */
loadAndSetEnv(process.env.MODE, process.cwd()); //maybe don't bother with this.

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '@gui/': PACKAGE_ROOT + '/',
      '@common/': path.resolve(PACKAGE_ROOT, '../common') + '/',
      //https://github.com/mui-org/material-ui/issues/21377#issuecomment-798917033
      '@material-ui/icons': '@material-ui/icons/esm',
    },
  },
  plugins: [reactRefresh(), vitePluginString({
      /* Default: true */
      // if true, using logic from rollup-plugin-glsl, which breaks the shaders
      compress: false
  })],
  base: '',
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    polyfillDynamicImport: false,
    outDir: 'dist', //pending review
    assetsDir: '.',
    terserOptions: {
      ecma: 2020,
      compress: {
        passes: 2,
      },
      safari10: false,
    },
    rollupOptions: {
      external: [
        ...builtinModules,
      ],
    },
    emptyOutDir: true,
  },
});

