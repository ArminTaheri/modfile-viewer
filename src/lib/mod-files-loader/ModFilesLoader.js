import React from 'react';
import { setObservableConfig, createEventHandler, componentFromStream } from 'recompose';
import * as most from 'most';
import { DEFAULT_COLOR_MAP } from '../modfile-parsing/Color';
import { fetchModFile } from '../modfile-parsing/modFileParsing';
import { TabbedViews } from '../tabbed-views/TabbedViews';
import './ModFilesLoader.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

// TODO: Toggle options

const INITIAL_VIEWER_STATE = {
  colorMaps: {
    frequency: [],
    correlation: DEFAULT_COLOR_MAP,
    tomography: DEFAULT_COLOR_MAP,
  },
  tomographyPoints: [],
  models: [],
  frequency: 0
}

const parseTomographyPoints = (text) => text.split("\n")
  .map(s => new Float32Array(s.trim().split(/\s+/).map(n => Number(n))))
;

const fetchTomographyPoints = url =>
  window.fetch(url)
    .then(res => res.text())
    .then(text => parseTomographyPoints(text))
;

/* State object:
  activeTab,
  setTab,
  models,
  activeModel,
  showModels,
  setModel,
  setShowModels,
  activeMeasure,
  setMeasure,
  tomography,
  tomographyPoints,
  activeTomography,
  setTomography,
  colorMaps,
  frequency,
  setFrequency,
  startFrequency,
  stepSize,
  numFrequencies,
*/

export const ModFilesLoader = componentFromStream(props$ => {
  const mergeState = (state, update) => Object.assign({}, state, update);
  const fetchedModels$ = props$
    .map(({ fileURLs }) => {
      return Promise.all(fileURLs.map(fetchModFile))
        .then(parsed => parsed.filter(x => x !== undefined))
        .then(inModels => {
          const models = inModels.filter(m => !!m.type);
          const getMinOf = (models, key) => {
            const list = models
              .filter(m => !isNaN(m[key]))
              .map(m => m[key])
            ;
            return Math.min(...list);
          };
          const startFrequency = getMinOf(models, 'startFrequency');
          const numFrequencies = getMinOf(models, 'numFrequencies');
          const stepSize = getMinOf(models, 'stepSize');
          return {
            models,
            activeModel: models[0],
            activeMeasure: 0,
            frequency: startFrequency,
            startFrequency,
            stepSize,
            numFrequencies
          };
        })
      ;
    })
    .awaitPromises()
  ;
  const fetchedTomographies$ = props$
    .map(({ tomographyURLs }) => {
      return Promise.all(tomographyURLs.map(fetchModFile))
        .then(parsed => parsed.filter(x => x !== undefined))
        .then(tomographies => ({ tomographies, activeTomography: tomographies[0] }))
      ;
    })
    .awaitPromises()
  ;
  const fetchedTomographyPoints$ = props$
    .map(({ tomographyPointsURLs }) => {
      return Promise.all(tomographyPointsURLs.map(fetchTomographyPoints))
        .then(tomographyPoints => ({ tomographyPoints }))
      ;
    })
    .awaitPromises()
  ;
  const { handler: setFrequency, stream: frequencyUpdates$ } = createEventHandler();
  const { handler: setModel, stream: activeModel$ } = createEventHandler();
  const { handler: setShowModels, stream: showModels$ } = createEventHandler();
  const { handler: setMeasure, stream: activeMeasure$ } = createEventHandler();
  const { handler: setTab, stream: activeTab$ } = createEventHandler();
  const { handler: setTomography, stream: activeTomography$ } = createEventHandler();
  const updateStream$ = most.mergeArray([
    fetchedModels$,
    fetchedTomographies$,
    fetchedTomographyPoints$,
    frequencyUpdates$.map(frequency => ({ frequency })),
    activeModel$.map(activeModel => ({ activeModel })),
    showModels$.map(showModels => ({ showModels })),
    activeMeasure$.map(activeMeasure => ({ activeMeasure })),
    activeTab$.map(activeTab => ({ activeTab })),
    activeTomography$.map(activeTomography => ({ activeTomography })),
  ]);
  return updateStream$
    .scan(mergeState, INITIAL_VIEWER_STATE)
    .map(state =>
      <TabbedViews
        setFrequency={setFrequency}
        setModel={setModel}
        setShowModels={setShowModels}
        setMeasure={setMeasure}
        setTab={setTab}
        setTomography={setTomography}
        {...state}
      />
    );
})
