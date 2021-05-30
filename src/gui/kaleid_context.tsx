import KaleidModel, { ObservableKaleidModel } from '@common/KaleidModel';
import { action, autorun, makeAutoObservable, makeObservable, observable } from 'mobx';
import React from 'react'
import VideoState from '@renderer/video_state';
//import { registerModelEvents } from './gui_comms';
import KaleidRenderer from '@renderer/kaleid_renderer';
import { isNum, Numeric, Tweakable } from '@common/tweakables';
import { sendModel } from './gui_comms';
let nextContextId = 0;
/** extra level of abstraction seems it may be unneeded, 
 * but this seems to allow vidState to react to change in GUI correctly, 
 * without the 'model' as sent to server etc needing to change */
export class KaleidContextType {
  model: ObservableKaleidModel;
  vidState: VideoState;
  parmMap: Map<string, Tweakable<Numeric>> = new Map();
  debugId: number;
  constructor(init: KaleidModel) {
    this.debugId = nextContextId++;
    this.model = new ObservableKaleidModel(init);
    this.vidState = new VideoState();
    this.vidState.keepMuted = true;
    autorun(() => {
      this.vidState.setImageState(this.model.imageSource);
    });
    this.model.tweakables.forEach(t => this.parmMap.set(t.name!, t));
    makeObservable(this.vidState, {
      //this being observable should mean when it gets set in the action above, 
      //observers of it in the GUI should update
      imageState: observable
    }, { name: `KaleidContextObservable #${this.model.id}` });
  }
  renderers: Map<string, KaleidRenderer> = new Map();
  getRenderer(key: string) {
    if (this.renderers.has(key)) {
      console.log('reusing renderer for ref', key);
      return this.renderers.get(key)!;
    }
    console.log(`making new KaleidRenderer for ref`, key);
    const r = new KaleidRenderer(this.vidState, this.model);
    //leaky... I should take care of items dropped from vDOM
    this.renderers.set(key, r);
    return r;
  }
  freeRenderer(key: string) {
    const r = this.renderers.delete(key);
    if (!r) throw `couldn't find renderer '${key}' to free.`
  }
  /** how do I set the model again? this isn't good. */
  applyTweakables(m: KaleidModel) {
    m.tweakables.forEach(t => {
      const p = this.parmMap.get(t.name!);
      if (!p) {
        console.error(`parm not found`);
        return;
      }
      if (isNum(t.value)) p.value = t.value
      else Object.assign(t.value, p.value);
    });
    sendModel(this.model);
  }
  applyDefaults() {
    this.model.tweakables.forEach(t => {
      if (t.default !== undefined) {
        if (isNum(t.value)) t.value = t.default;
        else Object.assign(t.value, t.default);
      }
    });
    sendModel(this.model);
  }
}


export const KaleidContext = React.createContext<KaleidContextType>(
  //sorry, I should really have a mock defaultValue.
  //https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
  undefined as unknown as KaleidContextType
);

export const useKaleid = () => {
  const kaleid = React.useContext(KaleidContext);
  if (!kaleid) throw new Error('useKaleid must be used within provider');
  return kaleid;
}

/** 
 * There was a `<KaleidListProvider>` in the root of the app, 
 * accessed through `useKaleidList()`, giving accesss to a ~global
 * context of all 'kaleid' rendererers active in the app.
 * We no longer use Context (or any hooks really) for that.
 **/
interface KaleidList {
  renderModels: KaleidContextType[];
  setRenderModels: (newModels: KaleidContextType[]) => void; //React.Dispatch<SetStateAction<KaleidContextType[]>>;
  addNewModel: (model: KaleidModel) => void;
}

export const globalKaleids: KaleidList = makeAutoObservable<KaleidList>({
  renderModels: [],
  setRenderModels: action((newModels) => globalKaleids.renderModels = newModels),
  addNewModel: action(model => {
    const l = globalKaleids.renderModels;
    globalKaleids.renderModels = [...l, new KaleidContextType(model)];
  })
}, undefined, { deep: false, name: 'KaleidList' });
// const KaleidRendererListContext = React.createContext<KaleidList | null>(null);

export const useKaleidList = () => {
  return globalKaleids;
}


/** Global (within the context of a GUI browser window) configuration options (mobx observable).
 * Currently there's little difference between using this directly vs in a `useLitConfig()` hook.
 * Hook probably pointless, so one or other may go away at some point.
 */
export const config = makeAutoObservable({
  presentation: true, showDebugSettings: false,
  livePreviews: true, enableVideoStreamInput: false, enableSpecialWidgets: true, paramsHack: true,
  newGui: false, skipAwaitVidDescriptor: true, transitionFadeOut: true, transitionPause: true,
  transitionDefaults: true, randomStartVid: false,
  //TODO: save these to config file? a bit risky pre-gig.
});
/** provide access to a global (within the context of a GUI browser window) set of 
 * configuration options.
 */
export const useLitConfig = () => { //can't be an observer because it's not a component; does this matter?
  //anything using this will tend to be an observer.

  //as it stands, could just export the config object,
  //not much need to be a hook, can just be a global observable object.
  //this could be refactored later
  return config;
}
