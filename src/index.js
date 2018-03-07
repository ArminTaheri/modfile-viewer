import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

const fileURLs = [
  { fileName: 'AVE-CROSS-A-0.MOD',  url: 'static/data/AVE-CROSS-A-0.MOD' },
  { fileName: 'AVE-ZCROSS-A-0.MOD', url: 'static/data/AVE-ZCROSS-A-0.MOD' },
  { fileName: 'AVE-COH-A-0.MOD',    url: 'static/data/AVE-COH-A-0.MOD' },
  { fileName: 'AVE-COR-A-0.MOD',    url: 'static/data/AVE-COR-A-0.MOD' },
  { fileName: 'AVE-BBSP-A-0.MOD',   url: 'static/data/AVE-BBSP-A-0.MOD' },
  { fileName: 'AVE-ZBBSP-A-0.MOD',  url: 'static/data/AVE-ZBBSP-A-0.MOD' }
]

const tomographyURLs = [
  { fileName: 'AVE-ETC-A-0.MOD',    url: 'static/data/AVE-ETC-A-0.MOD' },
  { fileName: 'AVE-ZETC-A-0.MOD',   url: 'static/data/AVE-ZETC-A-0.MOD' },
  { fileName: 'AVE-ETCBG-A-0.MOD',  url: 'static/data/AVE-ETCBG-A-0.MOD' },
  { fileName: 'AVE-ZETCBG-A-0.MOD', url: 'static/data/AVE-ZETCBG-A-0.MOD' }
]

const tomographyPointsURLs = [
  'static/data/atlas/ETCgrid.txt',
  'static/data/atlas/ETCBGgrid.txt'
]

const atlasURLs = {
  volume: 'static/data/atlas/mni_icbm152_t1_tal_nlin_sym_09c.nii',
  mask: 'static/data/atlas/mni_icbm152_gm_tal_nlin_sym_09c.nii'
}

const brainbrowserColormapURL = 'static/color-maps/gray-scale.txt';

window.MODData = window.MODData || {
  fileURLs,
  tomographyURLs,
  tomographyPointsURLs,
  atlasURLs,
  brainbrowserColormapURL
};

console.log('window.MODData', window.MODData);

ReactDOM.render(
  <App
    fileURLs={window.MODData.fileURLs}
    tomographyURLs={window.MODData.tomographyURLs}
    tomographyPointsURLs={window.MODData.tomographyPointsURLs}
    atlasURLs={window.MODData.atlasURLs}
    brainbrowserColormapURL={window.MODData.brainbrowserColormapURL}
  />,
  document.getElementById('mod-file-viewer')
);
