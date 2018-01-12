import ResizeObserver from 'resize-observer-polyfill';
import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import { enhanceWithRefs } from './enhanceWithRefs';
import { Plot } from './Plot';
import { CorrelationPlotData } from './PlotData';

const Loading = () => <div>Loading...</div>
const showLoading = branch(({ correlation }) => !correlation, renderComponent(Loading))

const CanvasPlot = (props) => <Plot {...props}><canvas /></Plot>;

const drawStatus = enhanceWithRefs({
  didMount() {
    this.updatePlot = () => {
    }
  }
})

const drawHead = enhanceWithRefs({
  didMount() {
  }
})

const drawColourMap = enhanceWithRefs({
  didMount() {
  }
})


export const CorrelationPlot = compose(
  showLoading,
  // enhanceWithRefs() needs to be applied together to pass react refs between each other.
  drawStatus,
  drawHead,
  drawColourMap
)(CanvasPlot)
