import React from 'react';
import { componentFromStream } from 'recompose';

const ModFileViewerComponent = ({ files }) => (
  <div>{files}</div>
);

export const ModFileViewer = componentFromStream(props$ =>
  props$.map(props => <ModFileViewerComponent {...props} />)
);
