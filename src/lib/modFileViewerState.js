import { createEventHandler } from 'recompose';
import I from 'immutable';
import axios from 'axios';
import { fromPromise } from 'most';
import { FreqPlotData } from './plot/PlotData';
import { QeegModFileParser, QeegModFileInterpreter } from 'qeegmodfile';

function parseModFile(buffer) {
  const parser = new QeegModFileParser();
  parser.setRawData(buffer);
  const parsed = parser.parse();
  if (!parsed) {
    alert('The .MOD file is currupt.');
    return;
  }
  return parser.parse();
}

function createPlotData(modData) {
  if (!modData) {
    return { dataArray: [] };
  }
  const interp = new QeegModFileInterpreter(modData);
  const type = interp.getTypeCode();
  const extractDomainInfo = (stepDimension, labelDimension) => [
    interp.getStartFrequency(),
    interp.getFrequencyResolution(),
    interp.getDimensionSizes()[stepDimension],
    interp.getDimensionSizes()[labelDimension],
    interp.getSpectrumLabels()[labelDimension],
  ];
  switch (type) {
    case 'CROSS': {
      const [startFreq, stepSize, steps, numLabels, labels] = extractDomainInfo(1, 2);
      const dataArray = [];
      const traces = new Array(numLabels).fill(true).map(() => new Float32Array(steps));
      labels.forEach((label, i) => {
        traces[i].forEach((_, j) => {
          traces[i][j] = interp.getSpectrum(0, j, i)[i];
        });
        const data = new FreqPlotData(startFreq, stepSize, steps, label)
          .addTrace(traces[i]);
        dataArray.push(data);
      });
      return { type, dataArray, frequencyStep: stepSize, /* correlation */ };
    }
    default:
      return { type, dataArray: [] }
  }
}

function fetchModFile(url) {
  return axios({
    url,
    method: 'get',
    responseType: 'blob',
  })
  .then(res => new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(res.data);
    reader.onload = function() {
      resolve(this.result);
    }
  }))
  .then(buffer => createPlotData(parseModFile(buffer)))
  .catch(err => console.warn(err));
}

const DEFAULT_FREQ_PLOT = I.Map()
  .set('axes', I.List())
  .update('axes', orientations =>
    orientations
      .push(I.fromJS({ orientation: 'bottom' }))
      .push(I.fromJS({ orientation: 'left' }))
  )
  .set('categoryIntervals', I.fromJS({
    'Delta': [0.5, 4],
    'Theta': [4, 7.5],
    'Alpha': [7.5, 12.5],
    'Beta': [12.5, 20]
  }))

export function createViewerStateStream(url) {
  const { handler: setter, stream: state$ } = createEventHandler();
  const mergeFetchedToState = (state, fetchedData) => {
    const { dataArray, frequencyStep, correlation } = fetchedData;
    return dataArray.reduce(
      (state, data, i) => state.setIn(['plots', i], DEFAULT_FREQ_PLOT.set('data', data)),
      state.merge(I.Map({ correlation, frequencyStep }))
    );
  };
  const initialState = I.Map({ plots: I.List() });
  const fetched = fromPromise(fetchModFile(url));
  return {
    setter,
    state$: state$
      .startWith(initialState)
      .combine(mergeFetchedToState, fetched)
  };
}
