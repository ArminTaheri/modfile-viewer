import React from 'react';
import PropTypes from 'prop-types';
import { ModFilesLoader } from './lib/mod-files-loader/ModFilesLoader';
import 'core-js';


const App = (props) =>
  <ModFilesLoader {...props} />
;

App.propTypes = {
  fileURLs: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      url: PropTypes.string
    })
  ),
  tomographyURLs: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      url: PropTypes.string
    })
  ),
  tomographyPointsURLs: PropTypes.arrayOf(PropTypes.string),
  atlasURLs: PropTypes.shape({
    volume: PropTypes.string,
    mask: PropTypes.string
  }),
  brainbrowserColormapURL: PropTypes.string
};

export default App;
