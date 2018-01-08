import React from 'react';
import { setObservableConfig,  } from 'recompose';
import { createEventHandler, componentFromStream } from 'recompose';
import I from 'immutable';
import axios from 'axios';
import { fromPromise } from 'most';
import { PlotData } from './lib/PlotData';
import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);


function fetchModFile(url) {
  return axios({
    url,
    method: 'get',
    responseType: 'text',
  })
  .then(res => new PlotData().loadFrom(res.data))
  .catch(err => console.warn(err));
}

const DEFAULT_PLOT = I.Map()
  .set('axes', I.List())
  .update('axes', orientations =>
    orientations
      .push(I.fromJS({ orientation: 'bottom' }))
      .push(I.fromJS({ orientation: 'left', units: 'Db' }))
  )
  .set('categoryIntervals', I.fromJS({
    // TODO: Compute from file metadata
    'A': [0, 10],
    'B': [10, 35],
    'C': [35, 40],
    'D': [40, 50]
  }))

const App = componentFromStream(() => {
  const { handler, stream: plots$ } = createEventHandler();
  const plots = [];
  for (let i = 0; i < 18; i++) {
    plots.push(DEFAULT_PLOT);
  }
  const fetched = fromPromise(
    Promise.all(plots.map(() => fetchModFile('static/data/fakemodfile.mod')))
  );
  const addDataArrayToPlots = (plots, dataArray) =>
    dataArray.reduce((plots, data, i) => plots.setIn([i, 'data'], data), plots);
  return plots$
    .startWith(I.List(plots))
    .combine(addDataArrayToPlots, fetched)
    .map(plots =>
      <div>
        <ModFileViewer plots={plots} setPlotsState={handler} />
      </div>
    );
})

export default App;
