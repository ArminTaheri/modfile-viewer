import React from 'react';
import { setObservableConfig, componentFromStream } from 'recompose';
import { createViewerStateStream } from './lib/modFileViewerState';
import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

window.fileURL = window.fileURL || 'static/data/AVE-CROSS-A-0.MOD';

const App = componentFromStream(() => {
  const { setter, state$ } = createViewerStateStream(window.fileURL);
  return state$
    .map(state =>
      <div>
        <ModFileViewer state={state} setter={setter} />
      </div>
    );
})

export default App;
