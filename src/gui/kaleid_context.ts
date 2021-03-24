import { ObservableKaleidModel } from '@common/KaleidModel';
import React from 'react'

export const KaleidContext = React.createContext<ObservableKaleidModel>(
  //sorry, I should really have a mock defaultValue.
  //https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
  undefined as unknown as ObservableKaleidModel
);