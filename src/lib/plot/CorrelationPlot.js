import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { lifecycle, mapProps, setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import ResizeObserver from 'resize-observer-polyfill';
import { Plot } from './Plot';
import { Color } from '../modfile-parsing/Color';
import { CorrelationPlotData } from '../modfile-parsing/PlotData';

const setPlotPropTypes = setPropTypes({
  cursorFreq: PropTypes.number,
  setCursorFreq: PropTypes.func.isRequired,
  colorMap: ImmutableTypes.listOf(PropTypes.instanceOf(Color)),
  plotState: ImmutableTypes.contains({
    data: PropTypes.instanceOf(CorrelationPlotData),
  })
})

const CanvasPlot = (props) =>
  <Plot {...props}><canvas /></Plot>
;

const Loading = () => <div>No data currently set.</div>
const showLoading = branch(({ plotState }) => !plotState, renderComponent(Loading))

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
  this.update = (plotContext, props) => {
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

const computeCanvasCircle = (width, height) => [
  width / 2,
  height / 2,
  Math.min(Math.abs(width), Math.abs(height)) / 4
]

const drawHead = new PlotD3Process({
  init(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas.getBoundingClientRect();
    const [x, y, r] = computeCanvasCircle(width, height);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.moveTo(x - 4, y - r); // haha it looks like a 3 'nose'
    ctx.lineTo(x, y - r - 4);
    ctx.lineTo(x + 4, y - r);
    ctx.stroke();
  },
  loop(plotContext, props) {
  }
})

const drawColorMap = new PlotD3Process({
  init(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas.getBoundingClientRect();
    const [x, y, r] = computeCanvasCircle(width, height);
    const x0 = x + 2 * r;
    const y0 = y - r;
    ctx.beginPath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    const colormap = props.colorMap ? props.colorMap.toJS() : [];
    colormap.forEach((color, i) => {
      const t = (i + 1) / colormap.length;
      grad.addColorStop(t, `rgb(${color.r * 254}, ${color.g * 254}, ${color.b * 254})`);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, 16, 70);
    ctx.strokeRect(x0, y0, 16, 70);
    ctx.stroke();
  },
  loop(plotContext, props) {
  }
})

const drawLabel = new PlotD3Process({
  init(plotContext, props) {
    this.draw = props => {
      const { canvas, ctx } = plotContext;
      const { width, height } = canvas.getBoundingClientRect();
      const [x, y, r] = computeCanvasCircle(width, height);
      const x0 = x - 2.4 * r;
      const y0 = y + 1.8 * r;
      ctx.font="14px Arial";
      const data = props.plotState.get('data');
      ctx.fillStyle = '#000';
      const text = `${data.label} ${props.cursorFreq ? props.cursorFreq + ' Hz' : ''}`;
      ctx.fillText(text, x0, y0);
      this.clearText = [x0 - 18, y0 - 18, ctx.measureText(text).width + 18, 20];
    };
    this.draw(props);
  },
  loop(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(...this.clearText)
    this.draw(props)
  }
})

const createPlotRenderer = () => {
  const plotContext = {};
  return compose(
    lifecycle({
      componentDidMount() {
        const { canvas } = plotContext;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        plotContext.ctx = canvas.getContext('2d');
        this.plotD3Process = drawHead
          .chain(drawColorMap)
          .chain(drawLabel)
          .initialize(plotContext, this.props)
          .update(plotContext, this.props)
        ;
      },
      componentWillUpdate(nextProps) {
        this.plotD3Process.update(plotContext, nextProps);
      }
    }),
    mapProps(() => ({ setRefs: refs => Object.assign(plotContext, refs) }))
  );
}

export const CorrelationPlot = compose(
  setPlotPropTypes,
  showLoading,
  // enhanceWithRefs() needs to be applied together to pass react refs between each other.
  createPlotRenderer()
)(CanvasPlot)
