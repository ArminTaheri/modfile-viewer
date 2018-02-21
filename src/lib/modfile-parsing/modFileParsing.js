import Promise from 'promise';
import I from 'immutable';
import { QeegModFileParser, QeegModFileInterpreter } from 'qeegmodfile';
import { FreqPlotData, CorrelationPlotData } from './PlotData';
import { DEFAULT_COLOR_MAP } from './Color';

export function parseModFile(buffer) {
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
function createViewerState(modData) {
  if (!modData) {
    return { type: null, filename: null};
  }
  const interp = window.interp= new QeegModFileInterpreter(modData);
  const type = interp.getTypeCode();
  const globalExtent = {};
  const extractDomainInfo = (stepDimension, labelDimension) => ({
    startFreq: interp.getStartFrequency(),
    stepSize: interp.getFrequencyResolution(),
    steps: interp.getDimensionSizes()[stepDimension],
    numLabels: interp.getDimensionSizes()[labelDimension],
    labels: interp.getSpectrumLabels()[labelDimension]
  });
  switch (type) {
    case 'ZCROSS':
    case 'CROSS': {
      const { startFreq, stepSize, steps, numLabels, labels } = extractDomainInfo(1, 2);
      globalExtent.x = [0, stepSize * (steps + 2)];
      globalExtent.y = [Infinity, -Infinity];
      const dataArray = [];
      const traces = new Array(numLabels).fill(true).map(() => new Float32Array(steps));
      const correlations = new Array(steps).fill(true).map(() => new Float32Array(numLabels));
      labels.forEach((label, i) => {
        traces[i].forEach((_, j) => {
          correlations[j][i] = transformation[type](interp.getSpectrum(0, j, i)[i]);
          traces[i][j] = transformation[type](interp.getSpectrum(0, j, i)[i]);
        });
        const data = new FreqPlotData(startFreq, stepSize, steps, label)
          .setExtent(globalExtent)
          .addTrace(traces[i])
        ;
        dataArray.push(data);
      });
      const plotStates = dataArray.reduce(
        (plotStates, data, i) => plotStates.set(i, DEFAULT_FREQUENCY_STATE.set('data', data)),
        I.List()
      );
      return {
        type,
        plotStates,
        startFrequency: startFreq,
        frequencyStep: stepSize,
        numFrequencies: steps,
        correlation: DEFAULT_CORRELATION_STATE.set('data', new CorrelationPlotData(labels, correlations, startFreq, stepSize, 'GP')),
        colorMap: I.List(DEFAULT_COLOR_MAP)
      };
    }
    case 'COH': {
      const { startFreq, stepSize, steps, numLabels, labels } = extractDomainInfo(1, 2);
      const dataArray = labels.map(label => new CorrelationPlotData('Coh ' + label));
      const plotStates = dataArray.reduce(
        (plotStates, data, i) => plotStates.set(i, DEFAULT_CORRELATION_STATE.set('data', data)),
        I.List()
      );
      return {
        type,
        plotStates,
        frequencyStep: stepSize,
        colorMap: I.List(DEFAULT_COLOR_MAP)
      };
    }
    case 'BBSP': {
      const [dimSizes, dimLabels] = [
        interp.getDimensionSizes(),
        interp.getSpectrumLabels()
      ];
      const [measures, bands] = [dimSizes[0], dimSizes[1]];
      const [mlabels, blabels] = [dimLabels[0], dimLabels[1]];
      const dataArray = [];
      // Generate Plot Labels ('AP Delta' ...)
      for (let i = 0; i < measures; i++) {
        for (let j = 0; j < bands; j++) {
          const split = mlabels[i].split(' ');
          const label = split
            .map(word => word.length > 0 ? word[0] : '')
            .concat(' ' + blabels[j])
            .join('')
          ;
          dataArray.push(new CorrelationPlotData(label))
        }
      }
      const plotStates = dataArray.reduce(
        (plotStates, data, i) => plotStates.set(i, DEFAULT_CORRELATION_STATE.set('data', data)),
        I.List()
      );
      return {
        type,
        plotStates,
        colorMap: I.List(DEFAULT_COLOR_MAP)
      }
    }
    default:
      return { type: null }
  }
}

export function fetchModFile(url) {
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
  .then(buffer => createViewerState(parseModFile(buffer)))
  .catch(err => { console.error(err); alert(err); });
}
