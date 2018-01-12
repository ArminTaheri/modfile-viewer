import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { lifecycle, defaultProps, setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import ResizeObserver from 'resize-observer-polyfill';
import { Plot } from './Plot';
import { CorrelationPlotData } from '../state/PlotData';
import { Color } from '../state/Color';

const setPlotPropTypes = setPropTypes({
  cursorFreq: PropTypes.number,
  setCursorFreq: PropTypes.func.isRequired,
  colorMap: ImmutableTypes.listOf(PropTypes.instanceOf(Color)),
  plotState: ImmutableTypes.contains({
    data: PropTypes.instanceOf(CorrelationPlotData),
  })
})

const CanvasPlot = (props) => <Plot {...props}><canvas /></Plot>;

const Loading = () => <div>No data currently set.</div>
const showLoading = branch(({ correlation }) => !correlation, renderComponent(Loading))

// Monadic class for chaining d3 drawing programs on the Plot DOM elements.
function PlotD3Process(spec) {
  this.processContext = {};
  if (spec) {
    const { init, loop } = spec;
    this.processContext = {};
    this.initHandlers = init instanceof Function ? [init.bind(this.processContext)] : [];
    this.drawHandlers = loop instanceof Function ? [loop.bind(this.processContext)] : [];
  } else {
    this.initHandlers = [];
    this.drawHandlers = [];
  }
  this.initialize = (plotContext, props) => {
    this.initHandlers.forEach(handler => handler(plotContext, props));
    return this;
  };
  this.update = (props, plotContext) => {
    this.drawHandlers.forEach(handler => handler(plotContext, props));
    return this;
  };
  this.chain = (plotD3Process) => {
    const compoundProcess = new PlotD3Process();
    compoundProcess.initHandlers = compoundProcess.initHandlers
      .concat(this.initHandlers, plotD3Process.initHandlers);
    compoundProcess.drawHandlers = compoundProcess.drawHandlers
      .concat(this.drawHandlers, plotD3Process.drawHandlers);
    return compoundProcess;
  };
}

const drawHead = new PlotD3Process({
  init(plotContext, props) {
  },
  loop(plotContext, props) {
  }
})

const drawColorMap = new PlotD3Process({
  init(plotContext, props) {
  },
  loop(plotContext, props) {
  }
})

const drawLabel = new PlotD3Process({
  init(plotContext, props) {
  },
  loop(plotContext, props) {
  }
})

const createPlotRenderer = () => {
  const plotContext = {};
  return compose(
    lifecycle({
      componentDidMount() {
        this.plotD3Process = drawHead
          .chain(drawColorMap)
          .chain(drawLabel)
          .initialize(this.props, plotContext)
          .update(this.props, plotContext)
        ;
      },
      componentWillUpdate() {
        this.plotD3Process.update(this.props, plotContext);
      }
    }),
    defaultProps({ setRefs: refs => Object.assign(plotContext, refs) })
  );
}

export const CorrelationPlot = compose(
  setPlotPropTypes,
  showLoading,
  // enhanceWithRefs() needs to be applied together to pass react refs between each other.
  createPlotRenderer()
)(CanvasPlot)
