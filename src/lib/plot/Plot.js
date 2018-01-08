import React from 'react';
import './Plot.css';

export const Plot = ({ setRefs, plotStyle }) =>
  <div style={plotStyle} className="plot-container" ref={container => setRefs({ container })}>
    <svg ref={svg => setRefs({ svg })}></svg>
  </div>
