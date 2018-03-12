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
  ZCROSS: ['NB1020'],
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
  studies,
  studyTypes,
  activeStudyType,
  setStudy,
  setStudies,
  showModels,
  setShowModels,
  activeMeasure,
  showMean,
  showSTDev,
  setShowMean,
  setShowSTDev,
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
  atlasURLs,
  brainbrowserColormapURL
}) => {
  if (!studies || !studies[activeStudyType]) {
    return <div>Loading...</div>;
  }
  const study = studies[activeStudyType];
  const models = study.selected;
  const viewers = modFileViewers({
    frequency,
    setFrequency,
    startFrequency,
    stepSize,
    numFrequencies,
    colorMaps,
    models,
    activeMeasure,
    showMean,
    showSTDev,
    setShowMean,
    setShowSTDev
  });
  const layouts = typeToLayouts[activeStudyType].map(layoutName => viewers[layoutName]);
  const activeTabIndex = activeTab || 0;
  const activeLayout = layouts[activeTabIndex];
  const TAG_SIZE = 10;
  const ColorTag = ({ hex }) =>
    <div
      style={{
        display: 'inline-block',
        backgroundColor: hex,
        width: `${TAG_SIZE}px`,
        height: `${TAG_SIZE}px`
      }}
    >
    </div>
  ;
  const modelSelectComponent = selected => (model, i) => {
    const index = selected.findIndex(s => s === model);
    const isSelected = index !== -1;
    return (
      <li key={i} className="model-selector-list-item">
        <div
          onClick={() => { studies[activeStudyType] = activeLayout.updateStudy(study, model); setStudies(studies)}}
          className={`model-selector ${isSelected ? '--selected' : ''}`}
        >
          <h5>{model.longType}</h5>
          {
            ['CROSS', 'ZCROSS'].includes(model.type) &&
            isSelected &&
            colorMaps &&  colorMaps.frequency && colorMaps.frequency.traces &&
            <ColorTag hex={colorMaps.frequency.traces[index % colorMaps.frequency.traces.length]} />
          }<small>{model.fileName}</small>
        </div>
      </li>
    );
  };
  const studySelectComponent = (studyType, i) => {
    const study = studies[studyType];
    return (
      <li key={i} className="study-selector-list-item">
        <div onClick={() => setStudy(studyType)} className="study-selector">
          <h5>{study.type}</h5>
          <br />
          { study.type === activeStudyType &&
            <ul>
              {study.models.map(modelSelectComponent(study.selected))}
            </ul>
          }
        </div>
      </li>
    );
  };
  const tomoSelectComponent = (tomography, i) =>
    <li key={i} className="model-selector-list-item">
      <div onClick={() => setTomography(tomography)} className={`model-selector ${tomography === activeTomography ? '--selected' : ''}`}>
        <h5>{tomography.models[0].longType}</h5>
        <small>{tomography.models[0].fileName}</small>
      </div>
    </li>
  ;
  const tomographyViewer =
    <TomographyViewer
      tomographyPoints={tomographyPoints}
      tomography={activeTomography.models[0]}
      colorMap={colorMaps.tomography}
      frequency={frequency}
      startFrequency={startFrequency}
      stepSize={stepSize}
      atlasURLs={atlasURLs}
      brainbrowserColormapURL={brainbrowserColormapURL}
    />
  ;
  const modelSelectStyle = {
    display: showModels ? 'flex' : 'none',
    minWidth: showModels ? '175px' : '0',
    maxWidth: showModels ? '175px' : '0'
  };
  return (
    <div className="tab-views-container">
      <div className="model-select">
        <div className="model-menu-icon" onClick={() => setShowModels(!showModels)}>
          <FontAwesomeIcon icon={faBars} />
        </div>
        <div className="model-select-container" style={modelSelectStyle}>
          <ul className="model-selector-list">
            {studyTypes.map(studySelectComponent)}
          </ul>
          <br />
          <ul className="model-selector-list">
            {tomographies && tomographies.map(tomoSelectComponent)}
          </ul>
        </div>

      </div>
      <div className="model-view">
        { models[0] &&
          <div>
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
        }
      </div>
    </div>
  );
}
