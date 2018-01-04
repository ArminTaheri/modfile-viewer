import React from 'react';

export const ModFileViewer = ({ setPlotState, plot }) =>
  <div onClick={() => setPlotState(plot.update('number', x => x + 1))}>
    {plot.get('number')}
  </div>
