import React from 'react';
import { modFileViewers } from '../mod-file-viewers/modFileViewers';
import { TomographyViewer } from '../tomography-viewer/TomographyViewer';
import './TabbedViews.css';

/* Possible viewer options:
    NB1020
    NB1020NOSTAT
    NB1020COMP
    BBAND
    CROSSMEASURES
*/
const typeToLayouts = {
  ZCROSS: ['NB1020NOSTAT', 'NB1020COMP'],
  CROSS: ['NB1020', 'NB1020COMP'],
  ZBBSP: ['BBAND'],
  BBSP: ['BBAND'],
  COH: ['CROSSMEASURES']
}

const Tabs = ({ activeIndex, setActiveIndex, viewers }) => {
  const tabs = viewers.map((viewer, i) =>
    <div
      key={`viewer-${i}`}
      onClick={() => setActiveIndex(i)}
      className={`tab-container ${i === activeIndex ? '--active' : ''}`}
    >
      {viewer.name}
    </div>
  );
  return <div className='tabs-container'>{tabs}</div>;
}

export const TabbedViews = ({ state, setter }) => {
  if (!state.has('type')) {
    return <div>Loading...</div>;
  }
  if (state.get('type') === null) {
    return (
      <div>
        The data cannot be opened with any type of vizualization.
        Please create an issue for a feature request.
      </div>
    )
  }
  const layouts = typeToLayouts[state.get('type')];
  const layoutKeyToViewer = modFileViewers({ state, setter });
  const viewers = layouts.map(key => layoutKeyToViewer[key]);
  const clamp = x => Math.min(Math.max(x, 0), viewers.length - 1)
  const activeIndex = clamp(Number(state.get('tab') || 0));
  const setActiveIndex = index => setter(state.set('tab', index));
  return (
    <div className='tab-views-container'>
      <Tabs
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        viewers={viewers}
      />
      <div className="tab-view-content">
        {viewers[activeIndex].createViewer()}
        {state.hasIn(['plotState', 'tomography']) ? <TomographyViewer state={state} setter={setter} /> : null}
      </div>
    </div>
  );
}
