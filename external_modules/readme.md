# workaround for some build woes

The results of `npm package` / `npm make` include a `node_modules` folder that is extremely unwieldy & mostly unnecessary.

The `package.json` in this 

Replacing that with this seems to help a lot (although we could suffer obscure bugs if there was a discrepancy between package versions).

For now, that's a risk I'm willing to take.

May be worth figuring out how to alter the package / make scripts to use this automatically, but not a huge chore to do manually for the time-being. On mac, it'll bundle in this whole `external_modules` folder in `thus-is-lit.app/Contents/Resources/app`. Assuming that it contains an appropriate `node_modules`, that should be moved in place of the other...