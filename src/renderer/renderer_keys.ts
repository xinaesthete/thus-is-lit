type CB = ()=>void | boolean;

const keyMap = new Map<string, CB>();

/** register a callback to associate with a given key. 
 * Callback may return a boolean which if true will `preventDefault()` and `stopPropogration()` */
export default function registerKey(key: string, callback: ()=>void){
  keyMap.set(key, callback);
}

window.onkeydown = (ev: KeyboardEvent) => {
  const cb = keyMap.get(ev.key);
  if (cb) {
    if (cb()) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
}

