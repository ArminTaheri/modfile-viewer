import React from 'react';
import './PlotCellGrid.css';

export const PlotCellGrid = (props) => {
  const {
    layout,
    children
  } = props;
  if (!layout) {
    return;
  }
  // TODO: see layouts.js
  // Each array is a column from left to right in the UI.
  // Each sub-array maps to cells starting from the top of the screen.
  return (
    <div className="cell-grid-container">
      {
        layout(children, props).map((col, i) =>
          <div key={`col-${i}`} className="cell-grid-row">
            {
              col.map((cell, j) =>
                <div key={`cell-${i}-${j}`} className="cell-grid-column">
                  {cell}
                </div>
              )
            }
          </div>
        )
      }
    </div>
  );
}
