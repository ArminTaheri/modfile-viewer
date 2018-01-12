import React, { Component } from 'react';
import NumericInput from 'react-numeric-input';
import './PlotCellGrid.css';

let last = null;

const inputsStyle = {
  display: 'flex',
  flexDirection: 'column',
  borderStyle: 'solid',
  height: '55px',
  borderWidth: '1px'
};

const FrequencyInput = ({ frequency, frequencyStep, setFrequency }) =>
  <div style={inputsStyle}>
    <label>Frequency: </label>
    <NumericInput
      step={frequencyStep || 1}
      precision={4}
      value={frequency}
      onChange={freq => setFrequency(freq)}
    />
  </div>
;

const StatsInput = ({ stats, setStats }) =>
  <div style={inputsStyle}>
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

export const PlotCellGrid = (props) => {
  const {
    headModel,
    frequency,
    frequencyStep,
    setFrequency,
    stats,
    setStats,
    frequencyInput,
    statsInput,
    children
  } = props;
  const renderedFrequencyInput =
    frequencyInput &&
    <FrequencyInput
      frequency={frequency}
      frequencyStep={frequencyStep}
      setFrequency={setFrequency}
   />
  ;
  const renderedStatsInput =
    statsInput &&
    <StatsInput stats={stats} setStats={setStats} />
  ;
  // TODO: see layouts.js
  // Each array is a column from left to right in the UI.
  // Each sub-array maps to cells starting from the top of the screen.
  const layout = [
    [frequency   , children[0] , children[1] , children[2]] ,
    [children[3] , children[4] , children[5] , children[6]  , children[7]],
    [headModel   , children[8] , children[9] , children[10]],
    [children[11], children[12], children[13], children[14] , children[15]],
    [stats       , children[16], children[17], children[18]]
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
