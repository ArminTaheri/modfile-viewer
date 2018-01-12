import Promise from 'promise';
import { createEventHandler } from 'recompose';
import I from 'immutable';
import { fromPromise } from 'most';
import { QeegModFileParser, QeegModFileInterpreter } from 'qeegmodfile';
import { FreqPlotData, CorrelationPlotData } from './PlotData';
import { DEFAULT_COLOR_MAP } from './Color';

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

const transformation = {
  CROSS: number => Math.log(number) / Math.log(Math.E),
  ZCROSS: number => Math.log(number) / Math.log(Math.E)
}

const DEFAULT_FREQUENCY_STATE = I.Map()
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

const DEFAULT_CORRELATION_STATE = I.Map()
  .set('colorMap', I.List(DEFAULT_COLOR_MAP))

/* Take a parsed .MOD file and interpret its contents case by case by study type.
 * Wrap the interpretted values into immutable data structures or data classes in state/PlotData.js.
 * Use the final structure as the applications new state.
 */
function createPlotData(modData) {
  if (!modData) {
    return null;
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
    case 'ZCROSS':
    case 'CROSS': {
      const [startFreq, stepSize, steps, numLabels, labels] = extractDomainInfo(1, 2);
      const dataArray = [];
      const traces = new Array(numLabels).fill(true).map(() => new Float32Array(steps));
      labels.forEach((label, i) => {
        traces[i].forEach((_, j) => {
          traces[i][j] = transformation[type](interp.getSpectrum(0, j, i)[i]);
        });
        const data = new FreqPlotData(startFreq, stepSize, steps, label)
          .addTrace(traces[i]);
        dataArray.push(data);
      });
      const plotStates = dataArray.reduce(
        (plotStates, data, i) => plotStates.set(i, DEFAULT_FREQUENCY_STATE.set('data', data)),
        I.List()
      );
      return {
        type,
        plotStates,
        frequencyStep: stepSize,
        correlation: DEFAULT_CORRELATION_STATE.set('data', new CorrelationPlotData('GP')),
        colorMap: I.List(DEFAULT_COLOR_MAP)
      };
    }
    case 'COH': {
      return { type }
    }
    case 'ZBBSP':
    case 'BBSP': {
      return { type }
    }
    default:
      return { type: null, dataArray: [] }
  }
}

function fetchModFile(url) {
  return fetch(url, {
    method: 'get',
    responseType: 'blob',
  })
  .then(res => res.blob())
  .then(blob => new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onload = function() {
      resolve(this.result);
    }
  }))
  .then(buffer => createPlotData(parseModFile(buffer)))
  .catch(err => { console.error(err); alert(err); });
}


export function loadViewerStateStream(url) {
  const { handler: setter, stream: state$ } = createEventHandler();
  const initialState = I.Map({});
  const fetched$ = fromPromise(fetchModFile(url));
  return {
    setter,
    state$: state$
      .startWith(initialState)
      .combine((state, fetched) => state.merge(I.Map(fetched)), fetched$)
  };
}
