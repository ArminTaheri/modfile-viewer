import ResizeObserver from 'resize-observer-polyfill';
import React  from 'react';
import PropTypes from 'prop-types';
import { withHandlers, setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import { FreqPlotData } from '../modfile-parsing/PlotData';
import { enhanceWithRefs, Plot } from './Plot';

// TODO: Rewrite to follow same code style as plot/CorrelationPlot.js
const setPlotPropTypes = setPropTypes({
  frequency: PropTypes.number,
  setFrequency: PropTypes.func,
  colorMaps: PropTypes.shape({
    traces: PropTypes.arrayOf(PropTypes.string),
    mean: PropTypes.string,
    stdev: PropTypes.string
  }),
  plots: PropTypes.arrayOf(PropTypes.instanceOf(FreqPlotData)),
  showMean: PropTypes.bool,
  showSTDev: PropTypes.bool
})

const Loading = () => <div>No data currently set.</div>
const showLoading = branch(({ plots }) => !plots, renderComponent(Loading))

const getScales = (extent, { top, left, width, height }) => {
  const xScale = d3.scaleLinear()
    .domain([extent.x[0], extent.x[1]])
    .rangeRound([0, width])
  ;
  const yScale = d3.scaleLinear()
    .domain([extent.y[0], extent.y[1] + 1])
    .rangeRound([height, 0])
  ;
  const xInvScale = d3.scaleLinear()
    .domain([0, width])
    .range([extent.x[0], extent.x[1]])
  ;
  const yInvScale = d3.scaleLinear()
    .domain([height, 0])
    .range([extent.y[0], extent.y[1] + 1])
  ;
  return { xScale, yScale, xInvScale, yInvScale };
};

const PADDING = { left: 50, top: 5, right: 60, bottom: 25 };
const getPlotDimensions = (rect) => ({
  left: PADDING.left,
  top: PADDING.top,
  width: rect.width - PADDING.right,
  height: rect.height - PADDING.bottom
});

const cursorClickHandler = ({ plots, setFrequency }, event) => {
  const plot = plots[0];
  if (!(event.button === 0 && event.buttons > 0)) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const dims = getPlotDimensions(rect);
  const { extent } = plot;
  const { xInvScale } = getScales(extent, dims);
  const mouseX = event.clientX - rect.left - dims.left;
  if (mouseX < 0 || mouseX > dims.width) {
    return;
  }
  const newFreq = xInvScale(mouseX);
  if (newFreq > extent.x[0] && newFreq < extent.x[1]) {
    setFrequency instanceof Function && setFrequency(newFreq);
  }
}

const cursorClick = withHandlers({
  onMouseMove: props => event => {
    cursorClickHandler(props, event)
  },
  onMouseDown: props => event => {
    cursorClickHandler(props, event)
  }
})

// Drawing enhancers:
const statusText = enhanceWithRefs({
  didMount() {
    const  { plots, colorMaps } = this.props;
    const colorMap = colorMaps.traces || [];
    const  { svg } = this.nodeRefs;
    const rect = svg.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    d3.select(svg)
      .append('g')
      .append('text')
      .style('font-size', '11px')
      .attr('fill', 'black')
      .attr('transform', `translate(${dims.left + dims.width - 60}, ${dims.top + 15})`)
      .text(plots[0].label)
    ;
    const drawCursorText = (plot, i) => {
      return d3.select(svg)
        .append('g')
        .append('text')
        .style('font-size', '10px')
        .attr('fill', (colorMap[i % colorMap.length]) || 'black')
        .attr('transform', `translate(${dims.left + dims.width - 60}, ${dims.top + 30 + i * 8})`)
      ;
    };
    let cursorTexts = [];
    this.updatePlot = () => {
      const  { plots, frequency } = this.props;
      cursorTexts.forEach(cursorText => cursorText.remove());
      cursorTexts = [];
      plots.forEach((plot, i) => {
        const { domain, traces } = plot;
        if (!(domain && domain.length)) {
          return;
        }
        const index = Math.floor(Math.min((frequency - plot.startFrequency) / plot.stepSize, plot.steps));
        if (plot.traces[0][index]) {
          const rounded = Math.round(traces[0][index] * 1000) / 1000
          cursorTexts[i] = drawCursorText(plot, i);
          cursorTexts[i].text(rounded);
        }
      })
    };
    this.updatePlot();
  }
})
const cursor = enhanceWithRefs({
  didMount()  {
    const { plots } = this.props;
    const plot = plots[0];
    const  { graphArea, container } = this.nodeRefs;
    const rect = container.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    const { extent } = plot;
    const { xScale, yScale } = getScales(extent, dims);
    let cursor;
    this.updatePlot = () => {
      const { frequency } = this.props;
      if (cursor) {
        cursor.remove();
      }
      if (frequency && frequency > extent.x[0] && frequency < extent.x[1]) {
        cursor = graphArea
          .append('line')
          .attr('x1', xScale(frequency))
          .attr('y1', yScale(extent.y[0]))
          .attr('x2', xScale(frequency))
          .attr('y2', yScale(extent.y[1]))
          .attr('stroke-width', 1)
          .attr('stroke', 'red')
        ;
      }
    };
    this.updatePlot();
  }
})

const axisBottom = enhanceWithRefs({
  didMount() {
    let axis = null;
    this.updatePlot = () => {
      const { axes, plots } = this.props;
      const plot = plots[0];
      const rect = this.nodeRefs.container.getBoundingClientRect();
      const dims = getPlotDimensions(rect);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'bottom' orientation, draw the axis.
      if (plot.options.axes.map(a => a.orientation).includes('bottom')) {
        axis =
          d3.select(this.nodeRefs.svg)
            .append('g')
            .attr('transform', `translate(${dims.left}, ${dims.height + dims.top})`)
        ;
        let tickValues = []
        const extent = JSON.parse(JSON.stringify(plot.extent));
        let xScale = getScales(extent, dims).xScale;
        let axisFunc = d3.axisBottom(xScale).ticks(5);
        const { categoryIntervals } = plot.options;
        if (categoryIntervals) {
          tickValues = Object.keys(categoryIntervals)
            .map(key => categoryIntervals[key])
            .reduce((a,b) => a.concat(b), [])
            .reduce((a, b) => {
              if (a[a.length-1] === b) {
                return a;
              }
              return a.concat([b]);
            }, [])
          ;
          extent.x[0] = tickValues[0] || extent.x[0];
          extent.x[1] = tickValues[tickValues.length - 1] || extent.x[1];
          xScale = getScales(extent, dims).xScale;
          axisFunc = d3.axisBottom(xScale).ticks(1);
          axisFunc.tickValues(tickValues);
          axisFunc.tickFormat(() => '');
          Object.keys(categoryIntervals).forEach(key => {
            const ivl = categoryIntervals[key];
            axis
              .append('g')
              .append('text')
              .attr('fill', 'black')
              .attr('transform', `translate(${xScale((ivl[0] + ivl[1]) / 2)}, ${15})`)
              .text(key)
            ;
          });
        }
        axis.call(axisFunc);
      }
    }
    this.updatePlot();
  }
})

const axisLeft = enhanceWithRefs({
  didMount() {
    let axis = null;
    this.updatePlot = () => {
      const { plots } = this.props;
      const plot = plots[0];
      const rect = this.nodeRefs.container.getBoundingClientRect();
      const dims = getPlotDimensions(rect);
      const { yScale } = getScales(plot.extent, dims);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'left' orientation, draw the axis.
      if (plot.options.axes.map(a => a.orientation).includes('left')) {
        const axisFunc = d3.axisLeft(yScale).ticks(5);
        axis =
          d3.select(this.nodeRefs.svg)
            .append('g')
            .attr('transform', `translate(${dims.left}, ${dims.top})`)
            .call(axisFunc)
        ;
        return;
      }
    }
    this.updatePlot();
  }
})

const curves = enhanceWithRefs({
  didMount() {
    const { plots, colorMaps, setRefs } = this.props;
    const colorMap = colorMaps.traces || [];
    /* TODO: get mean and stdev traces somehow
     * const meanTrace = new Float32Array(plots[0].length).fill(0);
     * const stdevTrace = new Float32Array(plots[0].length).fill(0);
     */
    const rect = this.nodeRefs.container.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    const { xScale, yScale } = getScales(plots[0].extent, dims);
    const lines = [];
    const graphArea = d3.select(this.nodeRefs.svg)
     .append('g')
     .attr('transform', `translate(${dims.left}, ${dims.top})`)
    if (setRefs instanceof Function) {
      setRefs({ graphArea });
    }
    const drawLine = (index, xScale, yScale, dims, colorMap, domain, trace) => {
      const svgLine = graphArea.append('path')
       .attr('fill', 'none')
       .attr('stroke', colorMap[index % colorMap.length] || 'black')
       .attr('stroke-linejoin', 'round')
       .attr('stroke-linecap', 'round')
       .attr('stroke-width', 1)
      ;
      const line = d3.line()
        .x(i => xScale(domain[i]))
        .y(i => yScale(trace[i]))
      ;
      const indices = domain.map((_, i) => i);
      svgLine
        .datum(indices)
        .attr('d', line)
      ;
      return svgLine;
    };
    plots.forEach((plot, i) => {
      plot.traces.forEach(trace => {
        lines.push(drawLine(i, xScale, yScale, dims, colorMap, plot.domain, trace));
      });
    });
    this.updatePlot = () => {
      const { plots, colorMaps } = this.props;
      const colorMap = colorMaps.traces || [];
      const rect = this.nodeRefs.container.getBoundingClientRect();
      const dims = getPlotDimensions(rect);
      const { xScale, yScale } = getScales(plots[0].extent, dims);
      lines.forEach((line) => line.remove());
      plots.forEach((plot, i) => {
        plot.traces.forEach(trace => {
          lines.push(drawLine(i, xScale, yScale, dims, colorMap, plot.domain, trace));
        });
      });
    }
    this.updatePlot();
  }
})


const updateOnResize = enhanceWithRefs({
  didMount() {
    this.mounted = true;
    this.resizeObserver = new ResizeObserver(() => { if (this.mounted) { this.forceUpdate(); } });
    this.resizeObserver.observe(this.nodeRefs.container);
  },
  willUnmount() {
    this.mounted = false;
  }
})

const SVGPlot = ({ plots, frequency, setFrequency, colorMaps, categoryIntervals, showMean, showSTDev, ...props }) =>
  <Plot {...props}>
    <svg />
  </Plot>
;

export const FrequencyPlot = compose(
  setPlotPropTypes,
  showLoading,
  cursorClick,
  // enhanceWithRefs() needs to be applied together to pass react refs between each other.
  updateOnResize,
  statusText,
  cursor,
  curves,
  axisLeft,
  axisBottom
)(SVGPlot)
