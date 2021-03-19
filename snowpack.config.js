// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    /* ... */
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    //may actually want to try to get minimal version of build where even internal modules are processed?
    "external": ["fs", "os", "path"]
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};
