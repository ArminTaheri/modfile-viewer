import React, { PureComponent }  from 'react';
import './PlotCellGrid.css';

export const PlotCellGrid = ({ headModel, children }) => {
  const inputsStyle = {
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'solid',
    height: '55px',
    borderWidth: '1px'
  };
  const frequency =
    <div style={inputsStyle}>
      <label>Frequency: </label>
      <input type="number" />
    </div>
  ;
  const stats =
    <div style={inputsStyle}>
      <div>
        <label>Mean: </label>
        <input type="checkbox" />
      </div>
      <div>
        <label>Std. Dev: </label>
        <input type="checkbox" />
      </div>
    </div>
  ;
  const layout = [
    [frequency, children[0], children[1], children[2]],
    [children[3], children[4], children[5], children[6], children[7]],
    [headModel, children[8], children[9], children[10]],
    [children[11], children[12], children[13], children[14], children[15]],
    [stats, children[16], children[17], children[18]]
  ];
  return (
    <div className="cell-grid-container">
      {
        layout.map((col, i) =>
          <div key={`col-${i}`} className="cell-grid-column">
            {
              col.map((cell, j) =>
                <div key={`cell-${i}-${j}`} className="cell-grid-row">
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
