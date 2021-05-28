const fs = require('fs');
const { spawn } = require('child_process');
const files = fs.readdirSync('.').filter(f => f.endsWith('.MOV') && !f.startsWith('.'));

/**
 * Hard-coded for the purpose of taking 60fps (59.94) and re-timing it to 25.
 * Expects user to call this script from a folder which contains files from G9.
 * Also scaling to 1080p because 4K is too heavy just now.
 */
async function processFile(f) {
    if (!f) return;
    //ffmpeg -i .\P1041065.MOV -r 25 -vf "setpts=(PTS-STARTPTS)*59.94/25" -crf 18 -an p1041065_rtest.mp4
    console.log('processing "' + f + '"...');
    const newName = f.replace('.MOV', '_slo_h264.mp4');
    if (fs.existsSync(newName)) {
        console.log(newName + ' already exists, skipping...');
        return;
    }
    const t = Date.now();
    const cp = spawn('ffmpeg', ['-i', f, '-r', '25', '-vf', '"setpts=(PTS-STARTPTS)*59.94/25"', 
    '-vf', 'scale=1920:1080', 
    '-c:v', 'libx264', '-crf', '18', '-an', newName]
    , { shell: true }
    );
    cp.stdout.on('data', (data) => console.log(`stdout [${f}]: ${data}`));
    cp.stderr.on('data', (data) => {
        //console.log(`stderr [${f}]: ${data}`)
        fs.appendFile('transcode_log.txt', data, ()=>{});
    });
    const promise = new Promise((resolve, reject) => {
        cp.on('close', (code) => {
            console.log(f, 'finished with code', code);
            console.log((Date.now() - t)/(1000*60) + ' minutes');
            if (code) process.exit(code);
            resolve();
        });
    });
    return promise;
}
(async function main() {
    for (let i = 0; i < files.length; i++) {
        await processFile(files[i]);
        // return;
    }
})();