const fs = require('fs');
const { spawn } = require('child_process');

const files = fs.readdirSync('.').filter(f => f.endsWith('.MOV'));

async function processFile(f) {
    //ffmpeg -i .\P1041065.MOV -r 25 -vf "setpts=(PTS-STARTPTS)*59.94/25" -crf 18 -an p1041065_rtest.mp4
    console.log('processing "' + f + '"...');
    const newName = f.replace('.MOV', '_slo_h264.mp4');
    const cp = spawn('ffmpeg', ['-i', f, '-r', '25', '-vf', '"setpts=(PTS-STARTPTS)*59.94/25"', '-c:v', 'libx264', '-crf', '18', '-an', newName], { shell: true });
    cp.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    cp.stderr.on('data', (data) => console.log(`stderr: ${data}`));
    const promise = new Promise((resolve, reject) => {
        cp.on('close', (code) => {
            console.log(f, 'finished with code', code);
            if (code) process.exit(code);
            resolve();
        });
    });
    return promise;
}
(async function main() {
    for (let i = 0; i < files.length; i++) {
        await processFile(files[i]);
    }
})();