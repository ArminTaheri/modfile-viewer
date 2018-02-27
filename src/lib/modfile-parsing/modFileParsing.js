import Promise from 'promise';
import { QeegModFileParser, QeegModFileInterpreter } from 'qeegmodfile';
import { FreqPlotData, CorrelationPlotData } from './PlotData';

export function parseModFile(buffer) {
  const parser = new QeegModFileParser();
  parser.setRawData(buffer);
  const parsed = parser.parse();
  if (!parsed) {
    return null;
  }
  return parser.parse();
}

const transformation = {
  CROSS: number => Math.log(Math.abs(number)) / Math.log(Math.E),
}


/* Take a parsed .MOD file and interpret its contents case by case by study type.
 * Wrap the interpretted values into immutable data structures or data classes in state/PlotData.js.
 * Use the final structure as the applications new state.
 */
export function extractModel(modData, fileName) {
  if (!modData) {
    return { type: null };
  }
  const interpreter = new QeegModFileInterpreter(modData);
  const type = interpreter.getTypeCode();
  const longType = interpreter.getType();
  const globalExtent = {};
  const model = {
    type,
    longType,
    fileName,
  };
  switch (type) {
    case 'ZCROSS':
    case 'CROSS': {
      const [
        measures,
        labels,
        startFrequency,
        stepSize,
        numFrequencies,
        numLabels,
      ] = [
        interpreter.getSpectrumLabels()[0],
        interpreter.getSpectrumLabels()[2],
        interpreter.getStartFrequency(),
        interpreter.getFrequencyResolution(),
        interpreter.getDimensionSizes()[1],
        interpreter.getDimensionSizes()[2]
      ];
      globalExtent.x = [0, stepSize * (numFrequencies + 2)];
      globalExtent.y = [Infinity, -Infinity];
      const traces = new Array(numLabels).fill(1).map(() => new Float32Array(numFrequencies));
      const correlations = new Array(numFrequencies).fill(1).map(() => new Float32Array(numLabels));
      const measurePlots = [];
      measures.forEach((measure, k) => {
        const plots = [];
        labels.forEach((label, i) => {
          traces[i].forEach((_, j) => {
            if (type === 'ZCROSS') {
              correlations[j][i] = interpreter.getSpectrum(k, j, i)[0];
              traces[i][j] = interpreter.getSpectrum(k, j, i)[0];
            } else {
              correlations[j][i] = transformation[type](interpreter.getSpectrum(0, j, i)[i]);
              traces[i][j] = transformation[type](interpreter.getSpectrum(0, j, i)[i]);
            }
          });
          const data = new FreqPlotData(startFrequency, stepSize, numFrequencies, label)
            .setExtent(globalExtent)
            .addTrace(traces[i])
          ;
          plots.push(data);
        });
        measurePlots.push(plots);
      });
      const correlation = new CorrelationPlotData(
        labels,
        correlations,
        startFrequency,
        stepSize
      );
      return Object.assign(model, {
        measurePlots,
        startFrequency,
        stepSize,
        numFrequencies,
        correlation
      });
    }
    case 'COH': {
      const [ startFrequency, stepSize, numFrequencies, labels ] = [
        interpreter.getStartFrequency(),
        interpreter.getFrequencyResolution(),
        interpreter.getDimensionSizes()[1],
        interpreter.getSpectrumLabels()[2],
      ];
      const plots = labels.map((label, i) => {
        const correlations = []
        for (let j = 0; j < numFrequencies; j++) {
          correlations[j] = interpreter.getSpectrum(0, j, i);
        }
        return new CorrelationPlotData(
          labels,
          correlations,
          startFrequency,
          stepSize,
          label
        );
      });
      return Object.assign(model, {
        measurePlots: [plots],
        startFrequency,
        stepSize,
        numFrequencies,
      });
    }
    case 'ZBBSP':
    case 'BBSP': {
      const [dimSizes, dimLabels] = [
        interpreter.getDimensionSizes(),
        interpreter.getSpectrumLabels()
      ];
      const [measures, bands] = [dimSizes[0], dimSizes[1]];
      const [mlabels, blabels] = [dimLabels[0], dimLabels[1]];
      const plots = [];
      const totals = [];
      // Generate Plot Labels ('AP Delta' ...)
      for (let i = 0; i < measures; i++) {
        for (let j = 0; j < bands; j++) {
          const split = mlabels[i].split(' ');
          const name = split
            .map(word => word.length > 0 ? word[0] : '')
            .concat(' ' + blabels[j])
            .join('')
          ;
          const correlations = [interpreter.getSpectrum(i, j)];
          plots.push(new CorrelationPlotData(dimLabels[2], correlations, 0, 0, name), )
        }
      }
      return Object.assign(model, {
        measurePlots: [plots],
        totals
      });
    }
    case 'ETC':
    case 'ZETC':
    case 'ETCBG':
    case 'ZETCBG': {
      const tomographies = [];
      const numTomographies = interpreter.getDimensionSizes()[1];
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < numTomographies; i++) {
        const tomography = interpreter.getSpectrum(0, i);
        tomographies.push(tomography);
        for (let j = 0; j < tomography.length; j++) {
          if (min > tomography[j]) {
            min = tomography[j]
          }
          if (max < tomography[j]) {
            max = tomography[j];
          }
        }
      }
      return Object.assign(model, {
        min,
        max,
        tomographies
      });
    }
    default:
      return { type: null }
  }
}

export function fetchModFile({ url, fileName: inFileName }) {
  const fileName = inFileName || url.split(/[\\/]/).pop();
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
  .then(buffer => extractModel(parseModFile(buffer), fileName))
  .catch(err => { console.error(err); alert(err); });
}
