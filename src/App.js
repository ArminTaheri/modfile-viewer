import React from 'react';
import { setObservableConfig,  } from 'recompose';
import { createEventHandler, componentFromStream } from 'recompose';
import I from 'immutable';
import axios, { CancelToken } from 'axios';
import { PlotData } from './lib/PlotData';
import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);


function fetchModFile(url) {
  let cancel;
  const promise = axios({
    url,
    method: 'get',
    responseType: 'text',
    cancelToken: new CancelToken(canceler => { cancel = canceler; })
  })
  .then(res => new PlotData().loadFrom(res.data))
  .catch(err => console.warn(err));
  return { promise, cancel };
}

const DEFAULT_PLOT = I.Map()
  .setIn(['axis', 'orientations'], I.List())
  .updateIn(['axis', 'orientations'], orientations =>
    orientations
      .push('bottom')
      .push('left')
  )
  .set('dimensions', I.fromJS({ height: 50 }))
  .set('categoryIntervals', I.fromJS({
    // TODO: Compute from file metadata
    'A': [0, 10],
    'B': [10, 35],
    'C': [35, 40],
    'D': [40, 50]
  }))
  .set('promisedData', fetchModFile('static/data/fakemodfile.mod'))



const App = componentFromStream(() => {
  const { handler, stream: plot$ } = createEventHandler();
  return plot$
    .startWith(DEFAULT_PLOT)
    .map((plot) =>
      <div className="App">
        <ModFileViewer plot={plot} setPlotState={handler} />
      </div>
    );
})

export default App;
