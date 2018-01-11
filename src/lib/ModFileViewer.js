import React  from 'react';
import I from 'immutable';
import { PlotCellGrid } from './plot-cell-grid/PlotCellGrid';
import { FrequencyPlot } from './FrequencyPlot'
import { CorrelationPlot } from './CorrelationPlot'

export const ModFileViewer = ({ setter, state }) => {
  const frequency = state.get('cursorFreq');
  const setFrequency = freq =>
    setter(state.set('cursorFreq', freq))
  ;
  const stats = state.has('stats') && state.get('stats').toJS();
  const setStats = nextStats =>
    setter(state.update('stats', stats => stats ? stats.merge(I.Map(nextStats)) : I.Map(nextStats)))
  ;
  const plotElements = state.get('plots').map((plot, i) =>
    <FrequencyPlot
      key={i}
      plotStyle={{ display: 'flex', minWidth: '100%', minHeight: '100%' }}
      plot={plot}
      cursorFreq={state.get('cursorFreq')}
      setCursorFreq={setFrequency}
      setPlotState={newPlot => setter(state.setIn(['plots', i], newPlot))}
    />
  );
  const headModel =
    <CorrelationPlot correlation={state.get('correlation')} />;
  return (
    <PlotCellGrid
      headModel={headModel}
      frequency={frequency}
      frequencyStep={state.get('frequencyStep')}
      setFrequency={setFrequency}
      stats={stats}
      setStats={setStats}
      frequencyInput
      statsInput
    >
      {plotElements.toJS()}
    </PlotCellGrid>
  )
}
