import React from 'react';
import { modFileViewers } from '../mod-file-viewers/modFileViewers';
import TomographyViewer from '../tomography-viewer/TomographyViewer';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/fontawesome-free-solid'
import './TabbedViews.css';

/* Possible viewer options:
    NB1020
    NB1020NOSTAT
    NB1020COMP
    BBAND
    CROSSMEASURES
*/
const typeToLayouts = {
  ZCROSS: ['NB1020NOSTAT'],
  CROSS: ['NB1020'],
  ZBBSP: ['BBAND'],
  BBSP: ['BBAND'],
  COH: ['CROSSMEASURES'],
  COR: ['CROSSMEASURES']
}

const Tabs = ({ activeTab, setTab, layouts }) => {
  const tabs = layouts.map((layout, i) =>
    <div
      key={`viewer-${i}`}
      onClick={() => setTab(i)}
      className={`tab-container ${i === activeTab ? '--active' : ''}`}
    >
      {layout.name}
    </div>
  );
  return <div className='tabs-container'>{tabs}</div>;
}

export const TabbedViews = ({
  activeTab,
  setTab,
  models,
  activeModel,
  setModel,
  showModels,
  setShowModels,
  activeMeasure,
  setMeasure,
  tomographies,
  tomographyPoints,
  activeTomography,
  setTomography,
  colorMaps,
  frequency,
  setFrequency,
  startFrequency,
  stepSize,
  numFrequencies,
}) => {
  if (models.length === 0) {
    return <div>Loading...</div>;
  }
  const model = activeModel
  const viewers = modFileViewers({
    frequency,
    setFrequency,
    startFrequency,
    stepSize,
    numFrequencies,
    colorMaps,
    model,
    activeMeasure
  });
  const layouts = typeToLayouts[model.type].map(layoutName => viewers[layoutName]);
  const activeTabIndex = activeTab || 0;
  const modelSelectComponent = (model, i) =>
    <li key={i} className="model-selector-list-item">
      <div onClick={() => setModel(model)} className={`model-selector ${model === activeModel ? '--selected' : ''}`}>
        <h5>{model.longType}</h5>
        <small>{model.fileName}</small>
      </div>
    </li>
  ;
  const tomoSelectComponent = (tomography, i) =>
    <li key={i} className="model-selector-list-item">
      <div onClick={() => setTomography(tomography)} className={`model-selector ${tomography === activeTomography ? '--selected' : ''}`}>
        <h5>{tomography.longType}</h5>
        <small>{tomography.fileName}</small>
      </div>
    </li>
  ;
  const tomographyViewer =
    <TomographyViewer
      tomographyPoints={tomographyPoints}
      tomography={activeTomography}
      colorMap={colorMaps.tomography}
      frequency={frequency}
      startFrequency={startFrequency}
      stepSize={stepSize}
    />
  ;
  const modelSelectStyle = {
    display: showModels ? 'flex' : 'none',
    minWidth: showModels ? '150px' : '0',
    maxWidth: showModels ? '150px' : '0'
  };
  return (
    <div className="tab-views-container">
      <div className="model-select">
        <div className="model-menu-icon" onClick={() => setShowModels(!showModels)}>
          <FontAwesomeIcon icon={faBars} />
        </div>
        <div className="model-select-container" style={modelSelectStyle}>
          <ul className="model-selector-list">
            {models.map(modelSelectComponent)}
          </ul>
          <br />
          <ul className="model-selector-list">
            {tomographies && tomographies.map(tomoSelectComponent)}
          </ul>
        </div>

      </div>
      <div className="model-view">
        <Tabs
          activeTab={activeTabIndex}
          setTab={setTab}
          layouts={layouts}
        />
        <div className="tab-view-content">
          <div className="tab-view-content-row">
            {layouts[activeTabIndex].createViewer()}
            {activeTomography ? tomographyViewer : null}
          </div>
        </div>
      </div>
    </div>
  );
}
