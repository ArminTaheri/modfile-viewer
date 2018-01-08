import React  from 'react';
import { PlotCellGrid } from './plot-cell-grid/PlotCellGrid';
import { FrequencyPlot } from './FrequencyPlot'
import { CorrelationPlot } from './CorrelationPlot'

export const ModFileViewer = ({ setter, state }) => {
  const plotElements = state.get('plots').map((plot, i) =>
    <FrequencyPlot
      key={i}
      plotStyle={{ display: 'flex', minWidth: '100%', minHeight: '100%' }}
      plot={plot}
      cursorFreq={state.get('cursorFreq')}
      setCursorFreq={freq => setter(state.set('cursorFreq', freq))}
      setPlotState={newPlot => setter(state.setIn(['plots', i], newPlot))}
    />
  );
  const headModel =
    <CorrelationPlot correlation={state.get('correlation')} />;
  return (
    <PlotCellGrid headModel={headModel}>
      {plotElements.toJS()}
    </PlotCellGrid>
  )
}
