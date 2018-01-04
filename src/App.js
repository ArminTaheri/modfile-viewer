import React from 'react';
import { setObservableConfig,  } from 'recompose';
import { createEventHandler, componentFromStream } from 'recompose';
import I from 'immutable';
import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

const INITIAL_PLOT = I.fromJS({
  number: 1
});

const App = componentFromStream(() => {
  const { handler, stream: plot$ } = createEventHandler();
  return plot$.startWith(INITIAL_PLOT).map((plot) =>
    <div className="App">
      <ModFileViewer plot={plot} setPlotState={handler} />
    </div>
  );
})

export default App;
