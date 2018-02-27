import React  from 'react';
import NumericInput from 'react-numeric-input';
import { PlotCellGrid } from '../plot-cell-grid/PlotCellGrid';
import { listToScalpLayout, listToMatrixLayout } from '../plot-cell-grid/layouts';
import { FrequencyPlot } from '../plot/FrequencyPlot'
import { CorrelationPlot } from '../plot/CorrelationPlot'
import './modFileViewers.css';

const FrequencyInput = ({ frequency, setFrequency, startFrequency, numFrequencies, stepSize }) =>
  <div className='modfile-viewer-input'>
    <label>Frequency: </label>
    <NumericInput
      className='freq-numeric-input'
      precision={4}
      value={frequency}
      step={stepSize}
      min={startFrequency}
      max={startFrequency + (numFrequencies - 1) * stepSize}
      onChange={setFrequency}
      format={num => num + ' Hz'}
    />
  </div>
;

const StatsInput = ({ stats, setStats }) =>
  <div className='modfile-viewer-input'>
    <div>
      <label>Mean: </label>
      <input
        type="checkbox"
        checked={!!stats.mean}
        onChange={e => setStats({ mean: e.target.checked })}
      />
    </div>
    <div>
      <label>Std. Dev: </label>
      <input
        type="checkbox"
        checked={!!stats.stdDev}
        onChange={e => setStats({ stdDev: e.target.checked })}
      />
    </div>
  </div>
;

export const scalpPositionFrequencyLayout = props => children => {
  const {
    headModel,
    frequency,
    setFrequency,
    startFrequency,
    numFrequencies,
    stepSize
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      frequency={frequency}
      setFrequency={setFrequency}
      startFrequency={startFrequency}
      numFrequencies={numFrequencies}
      stepSize={stepSize}
    />
  ;
  return listToScalpLayout(children, renderedFrequencyInput, headModel);
}

export const scalpPositionCorrelationLayout = props => children => {
  const {
    frequency,
    setFrequency,
    startFrequency,
    numFrequencies,
    stepSize
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      frequency={frequency}
      setFrequency={setFrequency}
      startFrequency={startFrequency}
      numFrequencies={numFrequencies}
      stepSize={stepSize}
    />
  ;
  return listToScalpLayout(children, renderedFrequencyInput);
}

export const scalpPositionMultiFrequencyLayout = props => children => {
  const {
    frequency,
    setFrequency,
    startFrequency,
    numFrequencies,
    stepSize
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      frequency={frequency}
      setFrequency={setFrequency}
      startFrequency={startFrequency}
      numFrequencies={numFrequencies}
      stepSize={stepSize}
    />
  ;
  return listToScalpLayout(children, renderedFrequencyInput);
}

export const matrixCorrelationTotalsLayout = () => children =>
  listToMatrixLayout(5, children)
;

export const modFileViewers = ({
  frequency,
  setFrequency,
  startFrequency,
  stepSize,
  numFrequencies,
  colorMaps,
  model,
  activeMeasure
}) => {
  const setFrequencyBounded = frequency => {
    const [min, max] = [startFrequency, startFrequency + stepSize * (numFrequencies - 1)];
    const boundedFrequency = Math.min(Math.max(min, frequency), max);
    setFrequency(boundedFrequency);
  }
  const makeFreqPlotCellGrid = enableStats => {
    const plotElements = model.measurePlots[activeMeasure].map((plot, i) =>
      <FrequencyPlot
        key={i}
        plotClass='modfile-viewer-plot'
        plot={plot}
        colorMap={colorMaps.frequency}
        frequency={frequency}
        setFrequency={setFrequencyBounded}
      />
    );
    const headModel = (
      <CorrelationPlot
        frequency={frequency}
        setFrequency={setFrequencyBounded}
        colorMap={colorMaps.correlation}
        plot={model.correlation}
        plotClass='modfile-viewer-plot'
      />
    );
    const layoutProps = {
      headModel,
      frequency,
      setFrequency: setFrequencyBounded,
      startFrequency,
      stepSize,
      numFrequencies,
    };
    return (
      <PlotCellGrid
        layout={scalpPositionFrequencyLayout(layoutProps)}
      >
        {plotElements}
      </PlotCellGrid>
    );
  };
  const makeCorrelationPlotCellGrid = () => {
    const plotElements = model.measurePlots[activeMeasure].map(plot =>
      <CorrelationPlot
        key={plot.name + frequency}
        frequency={frequency}
        setFrequency={setFrequencyBounded}
        colorMap={colorMaps.correlation}
        plot={plot}
        plotClass='modfile-viewer-plot'
      />
    );
    const layoutProps = {
      frequency,
      setFrequency: setFrequencyBounded,
      startFrequency,
      stepSize,
      numFrequencies,
    };
    return (
      <PlotCellGrid
        layout={scalpPositionCorrelationLayout(layoutProps)}
      >
        {plotElements}
      </PlotCellGrid>
    );
  }
  const makeMatrixCorrelationPlotCellGrid = () => {
    const plotElements = model.measurePlots[activeMeasure].map(plot =>
      <CorrelationPlot
        key={plot.name}
        setFrequency={setFrequencyBounded}
        colorMap={colorMaps.correlation}
        plot={plot}
        plotClass='modfile-viewer-plot'
      />
    );
    return (
      <PlotCellGrid
        layout={matrixCorrelationTotalsLayout()}
      >
        {plotElements}
      </PlotCellGrid>
    );
  }
  const NB1020 = {
    name: 'Narrow Band 10/20',
    createViewer: () => makeFreqPlotCellGrid(true)
  };
  const NB1020NOSTAT = {
    name: 'Narrow Band 10/20',
    createViewer: () => makeFreqPlotCellGrid(false)
  };
  const NB1020COMP = {
    name: 'Narrow Band 10/20 Comparison',
    createViewer: () => makeFreqPlotCellGrid(false)
  };
  const BBAND = {
    name: 'Broad Band',
    createViewer: () => makeMatrixCorrelationPlotCellGrid()
  };
  const CROSSMEASURES = {
    name: 'Cross Measures',
    createViewer: () => makeCorrelationPlotCellGrid()
  };
  return {
    NB1020,
    NB1020NOSTAT,
    NB1020COMP,
    BBAND,
    CROSSMEASURES
  };
}
