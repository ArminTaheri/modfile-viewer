import React, { Component } from 'react';
import { setObservableConfig } from 'recompose';
import mostConfig from 'recompose/mostObservableConfig'

import { ModFileViewer } from './lib/ModFileViewer';
import './App.css';

setObservableConfig(mostConfig)

class App extends Component {
  render() {
    return (
      <div className="App">
        <ModFileViewer />
      </div>
    );
  }
}

export default App;
