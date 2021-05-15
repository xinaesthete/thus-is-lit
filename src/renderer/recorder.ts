declare global { //todo: -> global.d.ts or something
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}
export default async function recordAndDownload(canvas: HTMLCanvasElement, dur: number) {
  console.log(`recording...`);
  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream, {mimeType: 'video/webm'}); //no vp9

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

  return new Promise<void>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedBlobs, {type: 'video/webm'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `kaleid${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      resolve();
    };
  });
}
