import React from 'react';
import { setObservableConfig, componentFromStream } from 'recompose';
import { loadViewerStateStream } from './lib/state/modFileViewerState';
import { TabbedViews } from './lib/tabbed-views/TabbedViews';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

window.fileURL = window.fileURL || 'static/data/AVE-CROSS-A-0.MOD';

const App = componentFromStream(() => {
  const { setter, state$ } = loadViewerStateStream(window.fileURL);
  return state$
    .map(state =>
      <div>
        <TabbedViews state={state} setter={setter} />
      </div>
    );
})

export default App;
