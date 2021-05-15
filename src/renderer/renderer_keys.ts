type CB = ()=>void;

const keyMap = new Map<string, CB>();

export default function registerKey(key: string, callback: ()=>void){
  keyMap.set(key, callback);
}

window.onkeydown = (ev: KeyboardEvent) => {
  const cb = keyMap.get(ev.key);
  if (cb) cb();
}

