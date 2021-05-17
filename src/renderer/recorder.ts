import fixWebmDuration from './fix_webm_duration';

declare global { //todo: -> global.d.ts or something
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}
export default async function recordAndDownload(canvas: HTMLCanvasElement, dur: number) {
  console.log(`recording...`);
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm', videoBitsPerSecond: 15000000
  });
  

  const recordedBlobs: Blob[] = [];
  recorder.ondataavailable = ev => {
    const {data} = ev;
    if (data.size > 0) {
      recordedBlobs.push(data);
    }
  };
  
  recorder.start();
  
  setTimeout(async ()=> {
    recorder.stop();
  }, dur);

  return new Promise<void>((resolve, reject) => {
    recorder.onstop = async () => {
      try {
        const blob = new Blob(recordedBlobs, {type: 'video/webm'});
        const url = URL.createObjectURL(await fixWebmDuration(blob, dur));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `kaleid${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 15000);
        resolve();
      } catch (ex) {
        reject(ex);
      }
    };
  });
}
