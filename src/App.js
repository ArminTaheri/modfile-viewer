import React from 'react';
import { ModFilesLoader } from './lib/mod-files-loader/ModFilesLoader';
import 'core-js';

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

const App = () =>
  <ModFilesLoader
    fileURLs={fileURLs}
    tomographyURLs={tomographyURLs}
    tomographyPointsURLs={tomographyPointsURLs}
  />
;

export default App;
export { ModFilesLoader }
