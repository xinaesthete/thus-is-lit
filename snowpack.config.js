const httpProxy = require('http-proxy');
const { networkInterfaces } = require('os');

//using this instead of 'localhost' doesn't seem to be helping my proxy.
const localExternalIP = (() => ([]).concat(...Object.values(networkInterfaces()))
  .filter(details => details.family === 'IPv4' && !details.internal)
  .shift().address)();


const proxy = httpProxy.createServer({target: `http://${localExternalIP}:8123`});
const wsProxy = httpProxy.createServer({target: `ws://${localExternalIP}:8123`, ws: true});

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
    {
      src: '/socket\.io/.*',
      dest: (req, res) => wsProxy.ws(req, res.socket)
    }
  ],
  packageOptions: {
    'external': ['fsevents', 'chokidar']
  },
  alias: {
    '@/': './src/',
    '@gui/': './src/gui/',
    '@server/': './src/server/',
    '@common/': './src/common/',
  },
};
