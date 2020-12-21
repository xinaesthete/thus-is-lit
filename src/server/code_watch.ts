import * as path from 'path'
import * as fs from 'fs'
import * as chokidar from 'chokidar'

const shaderLocation = path.join(`${__dirname}/../../src/renderer/shaders/kaleid_frag.glsl`);
console.log(shaderLocation);
export function watchFragmentShader(callback: (newCode:string)=>void) {
    chokidar.watch(shaderLocation, {ignoreInitial: true}).on('all', async () => {
        console.log(`shader code changed...`)
        const newCode = await fs.promises.readFile(shaderLocation, 'utf-8');
        callback(newCode);
    })
}