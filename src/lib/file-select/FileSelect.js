import React from 'react';
import { setObservableConfig, createEventHandler, componentFromStream } from 'recompose';
import I from 'immutable';
import { of } from 'most';
import { fetchModFile } from '../modfile-parsing/modFileParsing';
import { TabbedViews } from '../tabbed-views/TabbedViews';
import './FileSelect.css';

// use most.js streams to store state.
import mostConfig from 'recompose/mostObservableConfig';
setObservableConfig(mostConfig);

const FILE_CHOICES = [
  'AVE-CROSS-A-0.MOD',
  'AVE-COH-A-0.MOD',
  'AVE-BBSP-A-0.MOD',
];

export const FileSelect = componentFromStream(() => {
  const { handler: fileChoose, stream: filename$ } = createEventHandler();
  const fetchedStates$ = filename$
    .map(filename => {
      if (filename === null) {
        return Promise.resolve(I.Map({ filename: null }));
      }
      if (!filename) {
        return Promise.resolve();
      }
      return fetchModFile(`static/data/${filename}`)
        .then(state => I.Map(state).set('filename', filename))
      ;
    })
    .await()
  ;
  const { handler: setter, stream: state$ } = createEventHandler();
  return state$
    .merge(fetchedStates$)
    .merge(of(fetchModFile(`static/data/${FILE_CHOICES[0]}`).then(state => I.Map(state).set('filename', FILE_CHOICES[0]))).await())
    .startWith(I.Map({}))
    .map(state => {
      if (!state.get('filename')) {
        return (
          <ul>
            {
              FILE_CHOICES.map((filename, i) =>
                <li key={`${filename}-${i}`}>
                  <a href='#' onClick={e => { e.preventDefault(); fileChoose(filename) }} >
                    {filename}
                  </a>
                </li>
              )
            }
          </ul>
        );
      }
      return (
        <div>
          <div className='file-select-back-button' onClick={() => fileChoose(null)}>Back</div>
          <TabbedViews state={state} setter={setter} />
        </div>
      );
    });
})
