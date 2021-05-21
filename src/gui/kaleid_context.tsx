import KaleidModel, { ObservableKaleidModel } from '@common/KaleidModel';
import { autorun, makeAutoObservable, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { SetStateAction } from 'react'
import VideoState from '@renderer/video_state';
import { registerModelEvents } from './gui_comms';
import KaleidRenderer from '@renderer/kaleid_renderer';

/** extra level of abstraction seems it may be unneeded, 
 * but this seems to allow vidState to react to change in GUI correctly, 
 * without the 'model' as sent to server etc needing to change */
export class KaleidContextType {
  model: ObservableKaleidModel;
  vidState: VideoState;
  constructor(init: KaleidModel) {
      this.model = new ObservableKaleidModel(init);
      this.vidState = new VideoState();
      autorun(() => {
          this.vidState.setImageState(this.model.imageSource);
      }, {name: `KaleidContext #${this.model.id}`});
      makeObservable(this.vidState, {
          imageState: observable
      }, {name: `KaleidContextObserver #${this.model.id}`});
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
 * There is a `<KaleidListProvider>` in the root of the app, 
 * which can be accessed through `useKaleidList()`, giving accesss to a ~global
 * context of all 'kaleid' rendererers active in the app.
 * */
export interface KaleidList {
  renderModels: KaleidContextType[];
  setRenderModels: React.Dispatch<SetStateAction<KaleidContextType[]>>;
  addNewModel: (model: KaleidModel) => void;
  debugName: string;
}

export const KaleidRendererListContext = React.createContext<KaleidList | null>(null);

export const useKaleidList = () => {
  const list = React.useContext(KaleidRendererListContext);
  if (!list) {
    throw new Error('useKaleidList must be used within provider');
  }
  return list;
}

const config = makeAutoObservable({
  livePreviews: true, enableVideoStreamInput: false, enableSpecialWidgets: true
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

/** provide access to a global list of all active renderers in the app, 
 * along with interface for registering new.
 */
export const KaleidListProvider = observer(({...props}) => {
  //this whole thing is re-running e.g. when changing tab in app, 
  //meaning that we don't keep the same context that we had before.
  const [renderModels, setRenderModels] = React.useState([] as KaleidContextType[]);
  const listContext = makeAutoObservable({
    renderModels: renderModels, setRenderModels: setRenderModels, debugName: 'hello',
    addNewModel: (model: KaleidModel) => {
      const newModelContext = new KaleidContextType(model);
      setRenderModels([...renderModels, newModelContext]);
    },
    config: config
  }, undefined, {deep: false, name: 'KaleidList'});
  React.useEffect(()=> {
    ///careful, may be retriggering when not intended
    //-- at present, this is just re-establishing a module-scope variable
    //   so although it may be called at unncessary times,
    //   as long as there is only one of these contexts, it's harmless.
    registerModelEvents(listContext);
  }, [listContext]);
  return (
    <KaleidRendererListContext.Provider value={listContext}>
      {props.children}
    </KaleidRendererListContext.Provider>
  )
});
