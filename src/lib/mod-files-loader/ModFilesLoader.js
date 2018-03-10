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
    frequency: ['#6b7a8f', '#66cc66', '#f7882f', '#f7c331', '	#dcc7aa'],
    correlation: DEFAULT_COLOR_MAP,
    tomography: DEFAULT_COLOR_MAP,
  },
  tomographyPoints: [],
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
      return Promise.all((fileURLs || []).map(fetchModFile))
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
          const { ETC, ETCBG, ZETC, ZETCBG, ...studies } = models.reduce((studies, model) => {
            if (!studies[model.type]) {
              const type = model.type;
              studies[type] = { type, models: [], selected: [model]};
            }
            studies[model.type].models.push(model);
            return studies;
          }, {});
          const studyTypes = Object.keys(studies);
          studyTypes.sort().reverse();
          const tomographies = [ETC, ETCBG, ZETC, ZETCBG].reduce((a,b) => a.concat(b || []), [])
          return {
            studies,
            studyTypes,
            tomographies,
            activeTomography: tomographies[0],
            activeStudyType: studyTypes[0],
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
  const fetchedTomographyPoints$ = props$
    .map(({ tomographyPointsURLs }) => {
      return Promise.all((tomographyPointsURLs || []).map(fetchTomographyPoints))
        .then(tomographyPoints => ({ tomographyPoints }))
      ;
    })
    .awaitPromises()
  ;
  const { handler: setFrequency, stream: frequencyUpdates$ } = createEventHandler();
  const { handler: setStudy, stream: activeStudy$ } = createEventHandler();
  const { handler: setStudies, stream: studies$ } = createEventHandler();
  const { handler: setShowModels, stream: showModels$ } = createEventHandler();
  const { handler: setMeasure, stream: activeMeasure$ } = createEventHandler();
  const { handler: setTab, stream: activeTab$ } = createEventHandler();
  const { handler: setTomography, stream: activeTomography$ } = createEventHandler();
  const updateStream$ = most.mergeArray([
    fetchedModels$,
    fetchedTomographyPoints$,
    frequencyUpdates$.map(frequency => ({ frequency })),
    activeStudy$.map(activeStudyType => ({ activeStudyType })),
    studies$.map(studies => ({ studies: Object.assign({}, studies) })),
    showModels$.map(showModels => ({ showModels })),
    activeMeasure$.map(activeMeasure => ({ activeMeasure })),
    activeTab$.map(activeTab => ({ activeTab })),
    activeTomography$.map(activeTomography => ({ activeTomography })),
    props$.map(({ atlasURLs }) => ({ atlasURLs })),
    props$.map(({ colorMaps }) => ({ colorMaps: colorMaps || INITIAL_VIEWER_STATE.colorMaps })),
    props$.map(({ brainbrowserColormapURL }) => ({ brainbrowserColormapURL }))
  ]);
  return updateStream$
    .scan(mergeState, INITIAL_VIEWER_STATE)
    .map(state =>
      <TabbedViews
        setFrequency={setFrequency}
        setStudy={study => { setMeasure(0); setStudy(study); }}
        setStudies={setStudies}
        setShowModels={setShowModels}
        setMeasure={setMeasure}
        setTab={setTab}
        setTomography={setTomography}
        {...state}
      />
    );
})
