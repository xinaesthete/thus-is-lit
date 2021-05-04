/** @type { import("snowpack").SnowpackUserConfig } */
module.exports = {
  extends: 'electron-snowpack/config/snowpack.js',
  plugins: ['@snowpack/plugin-react-refresh'],
  mount: {
    'src/common': '/common',
    'src/gui': '/gui',
    'src/server': '/server',//probably don't want to mount this...
  },
  packageOptions: {
    'external': ['fsevents']
  },
  alias: {
    '@/': './src/',
    '@gui/': './src/gui/',
    '@server/': './src/server/',
    '@common/': './src/common/',
  },
};
