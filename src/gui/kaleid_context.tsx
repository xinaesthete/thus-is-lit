import { KaleidContextType } from '@common/KaleidModel';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import React, { SetStateAction } from 'react'
import { registerModelEvents } from './gui_comms';

export const KaleidContext = React.createContext<KaleidContextType>(
  //sorry, I should really have a mock defaultValue.
  //https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
  undefined as unknown as KaleidContextType
);

export interface KaleidList {
  renderModels: KaleidContextType[];
  setRenderModels: React.Dispatch<SetStateAction<KaleidContextType[]>>;
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

export const KaleidListProvider = observer(({...props}) => {
  const [renderModels, setRenderModels] = React.useState([] as KaleidContextType[]);
  const listContext = makeAutoObservable({
    renderModels: renderModels, setRenderModels: setRenderModels, debugName: 'hello'
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
