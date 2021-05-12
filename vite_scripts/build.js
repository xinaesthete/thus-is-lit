const {build} = require('vite');
const {dirname} = require('path');

const mode = process.env.MODE = 'production';

const configs = [
  'vite_scripts/vite.renderer.config.js', 'vite_scripts/vite.main.config.js'
];

const buildByConfig = (configFile) => build({configFile, mode});
(async () => {
  try {
    const totalTimeLabel = 'Total bundling time';
    console.time(totalTimeLabel);

    for (const packageConfigPath of configs) {

      const consoleGroupName = `${dirname(packageConfigPath)}/`;
      console.group(consoleGroupName);

      const timeLabel = 'Bundling time';
      console.time(timeLabel);

      await buildByConfig(packageConfigPath);

      console.timeEnd(timeLabel);
      console.groupEnd();
      console.log('\n'); // Just for pretty print
    }
    console.timeEnd(totalTimeLabel);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
