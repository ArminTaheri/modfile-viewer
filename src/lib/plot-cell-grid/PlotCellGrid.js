import React  from 'react';
import './PlotCellGrid.css';

export const PlotCellGrid = ({ children }) => {
  const headModel =
    <canvas></canvas>
  ;
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
  const Cl = ({ children }) =>
    <div className="cell-grid-column">{children}</div>
  ;
  const Rw = ({ children }) =>
    <div className="cell-grid-row">{children}</div>
  ;
  return (
    <div className="cell-grid-container">
      <Cl><Rw>{frequency}</Rw><Rw>{children[0]}</Rw><Rw>{children[1]}</Rw><Rw>{children[2]}</Rw></Cl>
      <Cl><Rw>{children[3]}</Rw><Rw>{children[4]}</Rw><Rw>{children[5]}</Rw><Rw>{children[6]}</Rw></Cl>
      <Cl><Rw>{headModel}</Rw><Rw>{children[7]}</Rw><Rw>{children[8]}</Rw><Rw>{children[9]}</Rw></Cl>
      <Cl><Rw>{children[10]}</Rw><Rw>{children[11]}</Rw><Rw>{children[12]}</Rw><Rw>{children[13]}</Rw></Cl>
      <Cl><Rw>{stats}</Rw><Rw>{children[14]}</Rw><Rw>{children[15]}</Rw><Rw>{children[16]}</Rw></Cl>
    </div>
  );
}
