import React from 'react';
import { setObservableConfig,  } from 'recompose';
import { createEventHandler, componentFromStream } from 'recompose';
import I from 'immutable';
import axios, { CancelToken } from 'axios';
import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

class PlotData {
  constructor() {
    this.domain = new Float32Array(1000);
    this.range = new Float32Array(1000);
  }
  loadFrom(file) {
    console.warn('Use real files here: ', file);
    // NOTE: Generate fake data for now
    const bounds = { min: 0, max: 50 };
    this.domain.forEach((_, i) => {
      const t = i / this.domain.length;
      this.domain[i] = bounds.min * (1 - t) + bounds.max * t;
    });
    this.range.forEach((_, i) => {
      this.range[i] = Math.random() * 100;
    });
    return this;
  }
}

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
    // Computed from file metadata
    categories: ['A', 'B', 'C', 'D'],
    intervals: [[0, 10], [10, 35], [35, 40], [40, 50]]
  }))
  .set('promisedData', fetchModFile('static/data/fakemodfile.mod'))
;


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
