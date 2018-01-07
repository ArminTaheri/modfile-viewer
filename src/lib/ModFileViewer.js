import React from 'react';
import d3 from 'd3';
import { renderComponent, compose, lifecycle, branch } from 'recompose';
import { enhanceWithRefs, Plot } from './plot';

const fetchData = lifecycle({
  componentDidMount() {
    const { plot, setPlotState } = this.props;
    plot.get('promisedData').promise.then(plotData => {
      plotData && setPlotState(plot.set('data', plotData)); // fake loading time
    });
  },
  componentWillUnmount() {
    const { plot } = this.props;
    plot.get('promisedData').cancel();
  }
});

const Loading = () => <div>Loading...</div>;
const showLoading = branch(({ plot }) => !plot.has('data'), renderComponent(Loading));

const resize = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.get('dimensions').toJS(), this.refs);
  },
  didUpdate() {
    const { plot } = this.props;
    console.log(plot.get('dimensions').toJS(), this.refs);
  }
});

const axes = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.getIn(['axis', 'orientations']).toJS(), this.refs);
  }
});

const curve = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.get('data'), this.refs);
  },
  didUpdate() {
    const { plot } = this.props;
    console.log(plot.has('data') && plot.get('data'), this.refs);
  }
});

const ModFilePlot = compose(fetchData, showLoading, resize, axes, curve)(Plot);

export const ModFileViewer = ({ setPlotState, plot }) => {
  return <ModFilePlot plot={plot} setPlotState={setPlotState} />;
}
