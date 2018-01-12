import React  from 'react';
import I from 'immutable';
import NumericInput from 'react-numeric-input';
import { PlotCellGrid } from '../plot-cell-grid/PlotCellGrid';
import { listToScalpLayout } from '../plot-cell-grid/layouts';
import { FrequencyPlot } from '../plot/FrequencyPlot'
import { CorrelationPlot } from '../plot/CorrelationPlot'
import { DEFAULT_COLOR_MAP } from '../state/Color'
import './modFileViewers.css';

const FrequencyInput = ({ cursorFreq, frequencyStep, setCursorFreq }) =>
  <div className='modfile-viewer-input'>
    <label>Frequency: </label>
    <NumericInput
      className='freq-numeric-input'
      step={frequencyStep || 1}
      precision={4}
      value={cursorFreq}
      onChange={freq => setCursorFreq(freq)}
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
    frequencyStep,
    cursorFreq,
    setCursorFreq,
    stats,
    setStats,
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      cursorFreq={cursorFreq}
      frequencyStep={frequencyStep}
      setCursorFreq={setCursorFreq}
    />
  ;
  const renderedStatsInput =
    <StatsInput stats={stats} setStats={setStats} />
  ;
  return listToScalpLayout(children, renderedFrequencyInput, headModel, renderedStatsInput);
}

export const scalpPositionCorrelationLayout = props => children => {
  const {
    cursorFreq,
    frequencyStep,
    setCursorFreq,
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      cursorFreq={cursorFreq}
      frequencyStep={frequencyStep}
      setCursorFreq={setCursorFreq}
    />
  ;
  return listToScalpLayout(children, renderedFrequencyInput);
}

export const scalpPositionMultiFrequencyLayout = props => children => {
  const {
    headModel,
    cursorFreq,
    frequencyStep,
    setCursorFreq,
  } = props;
  const renderedFrequencyInput =
    <FrequencyInput
      cursorFreq={cursorFreq}
      frequencyStep={frequencyStep}
      setCursorFreq={setCursorFreq}
    />
  ;
  return listToScalpLayout(children, renderedFrequencyInput, headModel);
}

export const modFileViewers = ({ state, setter }) => {
  const cursorFreq = state.get('cursorFreq');
  const frequencyStep = state.get('frequencyStep');
  const colorMap = state.get('colorMap') || DEFAULT_COLOR_MAP;
  const setCursorFreq = freq =>
    setter(state.set('cursorFreq', frequencyStep * Math.round(freq / frequencyStep)))
  ;
  const stats = state.has('stats') && state.get('stats').toJS();
  const setStats = nextStats =>
    setter(state.update('stats', stats => stats ? stats.merge(I.Map(nextStats)) : I.Map(nextStats)))
  ;
  const makeFreqPlotCellGrid = enableStats => {
    const plotElements = state.get('plotStates').map((plotState, i) =>
      <FrequencyPlot
        key={i}
        plotClass='modfile-viewer-plot'
        plotState={plotState}
        cursorFreq={cursorFreq}
        setCursorFreq={setCursorFreq}
        setPlotState={newPlot => setter(state.setIn(['plotStates', i], newPlot))}
      />
    );
    const headModel = (
      <CorrelationPlot
        plotClass='modfile-viewer-plot'
        plotState={state.get('correlation')}
        setCursorFreq={setCursorFreq}
        colorMap={colorMap}
      />
    );
    const layoutProps = {
      cursorFreq,
      frequencyStep,
      setCursorFreq,
      stats,
      setStats
    };
    return (
      <PlotCellGrid
        nullFillers={[headModel]}
        layout={scalpPositionFrequencyLayout(layoutProps)}
        enableStats={enableStats}
      >
        {plotElements.toJS()}
      </PlotCellGrid>
    );
  };
  const makeCorrelationPlotCellGrid = () => {
    const plotElements = state.get('plots').map((plot, i) =>
      <CorrelationPlot
        key={i}
        plotClass='modfile-viewer-plot'
        plot={plot}
        cursorFreq={cursorFreq}
        setCursorFreq={setCursorFreq}
        setPlotState={newPlot => setter(state.setIn(['plots', i], newPlot))}
      />
    );
    const layoutProps = {
      cursorFreq,
      setCursorFreq,
      frequencyStep,
      stats,
      setStats
    };
    return (
      <PlotCellGrid
        layout={scalpPositionCorrelationLayout(layoutProps)}
      >
        {plotElements.toJS()}
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
    createViewer: () => (
      null
    )
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
