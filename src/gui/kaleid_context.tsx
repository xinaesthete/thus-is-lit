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

export const useLitConfig = () => {
  //could be refactored later
  return useKaleidList().config;
}

export const KaleidListProvider = observer(({...props}) => {
  const [renderModels, setRenderModels] = React.useState([] as KaleidContextType[]);
  const config: LitConfig = {
    livePreviews: false, enableVideoStreamInput: false
  }
  const listContext = makeAutoObservable({
    renderModels: renderModels, setRenderModels: setRenderModels, debugName: 'hello',
    addNewModel: (model: KaleidModel) => {
      const newModelContext = new KaleidContextType(model);
      setRenderModels([...renderModels, newModelContext]);
    },
    config: config
  }, undefined, {deep: false, name: 'KaleidList'});
  React.useEffect(()=> {
    registerModelEvents(listContext);
  }, [listContext]);
  return (
    <KaleidRendererListContext.Provider value={listContext}>
      {props.children}
    </KaleidRendererListContext.Provider>
  )
});
