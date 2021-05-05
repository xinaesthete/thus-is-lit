const httpProxy = require('http-proxy');
const proxy = httpProxy.createServer({target: `http://localhost:8123`});

const routes = [
  'modelList',
  'getJsonState',
  'video',
  'videoDescriptor',
  'videoList',
  'image',
  'imageList',
  'setMainAssetPath',
  'getConfigPrefs',
  'openFileDialog',
  'rendererStarted',
  'socket.io'
].join('|');

/** @type { import("snowpack").SnowpackUserConfig } */
module.exports = {
  extends: 'electron-snowpack/config/snowpack.js',
  plugins: [
    '@snowpack/plugin-react-refresh',
    ['snowpack-plugin-raw-file-loader', {
      exts: ['.glsl']
    }]
  ],
  mount: {
    'src/common': '/common',
    'src/gui': '/gui',
    'src/renderer': '/renderer',
    // 'src/server': '/server',//probably don't want to mount this (in fact we get lots of errors)
  },
  devOptions: {
    //
    // port: 61016,
    // hmrPort: 5001
  },
  routes: [
    {
      src: `/(${routes}).*`,
      dest: (req, res) => {
        console.log(`proxying ${req.url} ${JSON.stringify(req.rawHeaders)}`)
        try {
          proxy.web(req, res)
        } catch (err) {
          console.error(err);
        } 
      }
    },
  ],
  packageOptions: {
    'external': ['fsevents', 'chokidar'],
    'knownEntrypoints': ['./src/renderer/index.tsx']
  },
  alias: {
    '@/': './src/',
    '@gui/': './src/gui/',
    '@renderer/': './src/renderer/',
    '@server/': './src/server/',
    '@common/': './src/common/',
  },
};
