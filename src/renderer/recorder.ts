import fixWebmDuration from './fix_webm_duration';

declare global { //todo: -> global.d.ts or something
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}
let activeRecorder: MediaRecorder | null = null;

export default async function recordAndDownload(canvas: HTMLCanvasElement, dur?: number, name = 'kaleid') {
  console.log(`recording...`);
  if (activeRecorder) {
    activeRecorder.onstop = () => console.log('old recording cancelled');
    activeRecorder.stop();
  }
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm', videoBitsPerSecond: 15e6
  });
  

  const recordedBlobs: Blob[] = [];
  recorder.ondataavailable = ev => {
    const {data} = ev;
    if (data.size > 0) {
      recordedBlobs.push(data);
    }
  };
  const startTime = Date.now();
  recorder.start();
  
  
  return new Promise<void>((resolve, reject) => {
    if (dur) {
      setTimeout(async ()=> {
        recorder.stop();
      }, dur);
    } else {
      activeRecorder = recorder;
    }
    recorder.onstop = async () => {
      try {
        activeRecorder = null;
        const blob = new Blob(recordedBlobs, {type: 'video/webm'});
        //maybe we could pass this off to a worker so it wouldn't stall main thread?
        const url = URL.createObjectURL(await fixWebmDuration(blob, Date.now()-startTime));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${name}.webm`;
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
export function stopRecording() {
  activeRecorder?.stop();
}
