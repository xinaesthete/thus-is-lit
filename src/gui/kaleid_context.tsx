import KaleidModel, { KaleidContextType } from '@common/KaleidModel';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import React, { SetStateAction } from 'react'
import { registerModelEvents } from './gui_comms';

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

export interface LitConfig {
  livePreviews: boolean;
  enableVideoStreamInput: boolean;
}
/** as well as a list of kaleids, 
 * this is being extended to other general global app state.
 * There is a <KaleidListProvider> in the root of the app, 
 * which can be accessed through 'useKaleidList()'
 * */
export interface KaleidList {
  renderModels: KaleidContextType[];
  setRenderModels: React.Dispatch<SetStateAction<KaleidContextType[]>>;
  addNewModel: (model: KaleidModel) => void;
  debugName: string;
  config: LitConfig;
}

export const KaleidRendererListContext = React.createContext<KaleidList | null>(null);

export const useKaleidList = () => {
  const list = React.useContext(KaleidRendererListContext);
  if (!list) {
    throw new Error('useKaleidList must be used within provider');
  }
  return list;
}

const config: LitConfig = makeAutoObservable({
  livePreviews: false, enableVideoStreamInput: false
});

export const useLitConfig = () => {
  //as it stands, could just export the config object,
  //not much need to be a hook, can just be a global observable object.
  //this could be refactored later
  return config;
}


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
    registerModelEvents(listContext);
  }, [listContext]);
  return (
    <KaleidRendererListContext.Provider value={listContext}>
      {props.children}
    </KaleidRendererListContext.Provider>
  )
});
