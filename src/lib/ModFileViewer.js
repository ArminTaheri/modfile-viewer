import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { setPropTypes, renderComponent, compose, lifecycle, branch } from 'recompose';
import d3 from 'd3';
import { enhanceWithRefs, Plot } from './plot';
import { PlotData } from './PlotData';

const setPlotPropTypes = setPropTypes({
  plot: ImmutableTypes.contains({
    axis: ImmutableTypes.contains({
      orientations: ImmutableTypes.listOf(PropTypes.string)
    }),
    dimensions: ImmutableTypes.contains({
      width: PropTypes.number,
      height: PropTypes.number
    }),
    promisedData: PropTypes.shape({
      promise: PropTypes.instanceOf(Promise),
      cancel: PropTypes.func
    }),
    data: PropTypes.instanceOf(PlotData)
  }).isRequired,
  setPlotState: PropTypes.func.isRequired
})

const fetchData = lifecycle({
  componentDidMount() {
    const { plot, setPlotState } = this.props;
    if (plot.has('promisedData')) {
      plot.get('promisedData').promise.then(plotData => {
        plotData && setPlotState(plot.set('data', plotData));
      });
    }
  },
  componentWillUnmount() {
    const { plot } = this.props;
    plot.get('promisedData').cancel();
  }
})

const Loading = () => <div>Loading...</div>
const showLoading = branch(({ plot }) => !plot.has('data'), renderComponent(Loading))

const resize = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.get('dimensions').toJS(), this.refs);
  },
  didUpdate() {
    const { plot } = this.props;
    console.log(plot.get('dimensions').toJS(), this.refs);
  }
})

const axes = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.getIn(['axis', 'orientations']).toJS(), this.refs);
  }
})

const curve = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    console.log(plot.get('data'), this.refs);
  },
  didUpdate() {
    const { plot } = this.props;
    console.log(plot.has('data') && plot.get('data'), this.refs);
  }
})

const ModFilePlot = compose(
  setPlotPropTypes,
  fetchData,
  showLoading,
  resize,
  axes,
  curve
)(Plot)

export const ModFileViewer = ({ setPlotState, plot }) => {
  return <ModFilePlot plot={plot} setPlotState={setPlotState} />;
}
