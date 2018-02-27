import React  from 'react';
import PropTypes from 'prop-types';
import { lifecycle, mapProps, setPropTypes, renderComponent, compose, branch } from 'recompose';
import { Plot } from './Plot';
import { ColorMap } from '../modfile-parsing/Color';
import { CorrelationPlotData } from '../modfile-parsing/PlotData';

const setPlotPropTypes = setPropTypes({
  frequency: PropTypes.number,
  colorMap: PropTypes.arrayOf(
    PropTypes.shape({
      t: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired
    }),
  ),
  plot: PropTypes.instanceOf(CorrelationPlotData)
})

const CanvasPlot = (props) =>
  <Plot {...props}><canvas /></Plot>
;

const Loading = () => <div>No data currently set.</div>
const showLoading = branch(({ plot }) => !plot, renderComponent(Loading))

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
  width / 3,
  height / 3 + 15,
  Math.min(Math.abs(width), Math.abs(height)) / 2.9
]

const drawHead = new PlotD3Process({
  loop(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas;
    const [x, y, r] = computeCanvasCircle(width, height);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.moveTo(x - 4, y - r);
    ctx.lineTo(x, y - r - 4);
    ctx.lineTo(x + 4, y - r);
    ctx.stroke();
  }
})

const drawColorMap = new PlotD3Process({
  loop(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas;
    const [x, y, r] = computeCanvasCircle(width, height);
    const x0 = x + r;
    const y0 = y - r;
    const gradDimensions = { top: -5, left: 20, width: 15, height: 2 * r };
    ctx.beginPath();
    const colormap = props.colorMap  || [];
    const grad = ctx.createLinearGradient(
      x0 + gradDimensions.left, //x0
      y0 + gradDimensions.top + gradDimensions.height,  //y0
      x0 + gradDimensions.left, //x1
      y0 + gradDimensions.top,  //y1
    );
    colormap.forEach((stop, i) => {
      const t = (i + 0.5) / colormap.length;
      grad.addColorStop(t, stop.color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(
      x0 + gradDimensions.left, //x0
      y0 + gradDimensions.top,  //y0
      gradDimensions.width, //x1
      gradDimensions.height //y1
    );
    ctx.strokeRect(
      x0 + gradDimensions.left, //x0
      y0 + gradDimensions.top,  //y0
      gradDimensions.width, //x1
      gradDimensions.height //y1
    );
    ctx.stroke();
    ctx.font="14px Arial";
    ctx.fillStyle = '#000';
    const data = props.plot;
    let text = `${Math.round(100 * data.extent[1]) / 100}`;
    ctx.fillText(text,
      x0 + gradDimensions.left + gradDimensions.width + 2,
      y0 + gradDimensions.top + 15
    );
    text = `${Math.round(100 * data.extent[0]) / 100}`;
    ctx.fillText(text,
      x0 + gradDimensions.left + gradDimensions.width + 2,
      y0 + gradDimensions.top + gradDimensions.height
    );
    text = `${data.units}`;
    ctx.fillText(text,
      x0 + gradDimensions.left,
      y0 + gradDimensions.top + gradDimensions.height + 20
    );
  }
})

const round = (n) => Math.round(n * 1000) / 1000;
const drawLabel = new PlotD3Process({
  loop(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas;
    const [x, y, r] = computeCanvasCircle(width, height);
    const x0 = x - r - 15;
    const y0 = y + r + 20;
    ctx.font="14px Arial";
    const data = props.plot;
    ctx.fillStyle = '#000';
    const text = `${data.name || ''} ${props.frequency ? round(props.frequency) + ' Hz' : ''}`;
    ctx.fillText(text, x0, y0);
  }
})

const COLOR_MAP_RESOLUTION = 50;
const drawHeatmap = new PlotD3Process({
  init(plotContext, props) {
    const { canvas } = plotContext;
    const { width, height } = canvas;
    const [x, y, r] = computeCanvasCircle(width, height);
    const hbox = this.hbox = {
      left: x - r,
      top: y - r,
      width: Math.ceil(2 * r) + 1,
      height: Math.ceil(2 * r) + 1
    };
    this.dataBuffer = new Uint32Array(hbox.width * hbox.height);
    this.drawBuffer = new Uint8ClampedArray(this.dataBuffer.buffer);
    this.imageData = new ImageData(this.drawBuffer, hbox.width, hbox.height);
    this.colorMap = new ColorMap(COLOR_MAP_RESOLUTION, props.colorMap || []);
  },
  loop(plotContext, props) {
    const { canvas, ctx } = plotContext;
    const { width, height } = canvas;
    const [x, y, r] = computeCanvasCircle(width, height);
    const data = props.plot;
    this.dataBuffer.forEach((_, i) => {
      let px = (this.hbox.left + (i % this.hbox.height) - x) / r;
      let py = (this.hbox.top + (i / this.hbox.height) - y) / r;
      if (px*px + py*py < 1.0) {
        const color = this.colorMap.interpolate(data.interpolate(6, props.frequency || 0, [px, py]));
        this.drawBuffer[i * 4 + 0] = color[0];
        this.drawBuffer[i * 4 + 1] = color[1];
        this.drawBuffer[i * 4 + 2] = color[2];
        this.drawBuffer[i * 4 + 3] = color[3];
      }
    });
    ctx.putImageData(this.imageData, this.hbox.left, this.hbox.top);
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
        this.plotD3Process = drawHeatmap
          .chain(drawHead)
          .chain(drawColorMap)
          .chain(drawLabel)
          .initialize(plotContext, this.props)
          .update(plotContext, this.props)
        ;
      },
      componentWillUpdate(nextProps) {
        const { canvas, ctx } = plotContext;
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        this.plotD3Process
          .update(plotContext, nextProps)
        ;
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
