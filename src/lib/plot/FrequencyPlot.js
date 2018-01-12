import ResizeObserver from 'resize-observer-polyfill';
import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { withHandlers, setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import { enhanceWithRefs } from './enhanceWithRefs';
import { Plot } from './Plot';
import { FreqPlotData } from './PlotData';

const setPlotPropTypes = setPropTypes({
  cursorFreq: PropTypes.number,
  setCursorFreq: PropTypes.func,
  plot: ImmutableTypes.contains({
    axes: ImmutableTypes.listOf(
      ImmutableTypes.contains({
        orientation: PropTypes.string,
        units: PropTypes.string
      })
    ),
    categoryIntervals: ImmutableTypes.mapOf(
      ImmutableTypes.listOf(PropTypes.number),
      PropTypes.string,
    ),
    data: PropTypes.instanceOf(FreqPlotData),
  }).isRequired,
  setPlotState: PropTypes.func.isRequired
})

const Loading = () => <div>Loading...</div>
const showLoading = branch(({ plot }) => !plot.has('data'), renderComponent(Loading))

const getScales = (extent, { top, left, width, height }) => {
  const xScale = d3.scaleLinear()
    .domain([extent.x[0], extent.x[1]])
    .rangeRound([0, width])
  ;
  const yScale = d3.scaleLinear()
    .domain([extent.y[0], extent.y[1]])
    .rangeRound([height, 0])
  ;
  const xInvScale = d3.scaleLinear()
    .domain([0, width])
    .range([extent.x[0], extent.x[1]])
  ;
  const yInvScale = d3.scaleLinear()
    .domain([height, 0])
    .range([extent.y[0], extent.y[1]])
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

const cursorClickHandler = ({ plot, setCursorFreq }, event) => {
  if (!(event.button === 0 && event.buttons > 0)) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const dims = getPlotDimensions(rect);
  const { extent } = plot.get('data');
  const { xInvScale } = getScales(extent, dims);
  const mouseX = event.clientX - rect.left - dims.left;
  if (mouseX < 0 || mouseX > dims.width) {
    return;
  }
  const newFreq = xInvScale(mouseX);
  if (newFreq > extent.x[0] && newFreq < extent.x[1]) {
    setCursorFreq(newFreq);
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
    const  { plot } = this.props;
    const  { svg } = this.nodeRefs;
    const rect = svg.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    d3.select(svg)
      .append('g')
      .append('text')
      .style('font-size', '11px')
      .attr('fill', 'black')
      .attr('transform', `translate(${dims.left + dims.width - 60}, ${dims.top + 15})`)
      .text(plot.get('data').label)
    ;
    const cursorValText = d3.select(svg)
      .append('g')
      .append('text')
      .style('font-size', '10px')
      .attr('fill', 'black')
      .attr('transform', `translate(${dims.left + dims.width - 60}, ${dims.top + 30})`)
    ;
    this.updatePlot = () => {
      const  { plot, cursorFreq } = this.props;
      const { domain, traces } = plot.get('data');
      domain.forEach((freq, i) => {
        if (cursorFreq >= freq && (domain[i + 1] !== undefined && cursorFreq < domain[i + 1])) {
          const rounded = Math.round(traces[0][i] * 1000) / 1000
          cursorValText.text(traces[0] !== undefined ? rounded : '')
        }
      })
    };
    this.updatePlot();
  }
})
const cursor = enhanceWithRefs({
  didMount() {
    const { plot } = this.props;
    const  { graphArea, container } = this.nodeRefs;
    const rect = container.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    const { extent } = plot.get('data');
    const { xScale, yScale } = getScales(extent, dims);
    let cursor;
    this.updatePlot = () => {
      const { cursorFreq } = this.props;
      if (cursor) {
        cursor.remove();
      }
      if (cursorFreq && cursorFreq > extent.x[0] && cursorFreq < extent.x[1]) {
        cursor = graphArea
          .append('line')
          .attr('x1', xScale(cursorFreq))
          .attr('y1', yScale(extent.y[0]))
          .attr('x2', xScale(cursorFreq))
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
      const { plot } = this.props;
      const rect = this.nodeRefs.container.getBoundingClientRect();
      const dims = getPlotDimensions(rect);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'bottom' orientation, draw the axis.
      if (plot.get('axes').map(a => a.get('orientation')).includes('bottom')) {
        axis =
          d3.select(this.nodeRefs.svg)
            .append('g')
            .attr('transform', `translate(${dims.left}, ${dims.height + dims.top})`)
        ;
        let tickValues = []
        const extent = JSON.parse(JSON.stringify(plot.get('data').extent));
        let xScale = getScales(extent, dims).xScale;
        let axisFunc = d3.axisBottom(xScale).ticks(5);
        if (plot.has('categoryIntervals')) {
          const catIvls = plot.get('categoryIntervals').toJS();
          tickValues = Object.keys(catIvls)
            .map(key => catIvls[key])
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
          Object.keys(catIvls).forEach(key => {
            const ivl = catIvls[key];
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
      const { plot } = this.props;
      const rect = this.nodeRefs.container.getBoundingClientRect();
      const dims = getPlotDimensions(rect);
      const { yScale } = getScales(plot.get('data').extent, dims);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'left' orientation, draw the axis.
      if (plot.get('axes').map(a => a.get('orientation')).includes('left')) {
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
    const { plot, setRefs } = this.props;
    const data = plot.get('data');
    const indices = data.domain.map((_, i) => i);
    const rect = this.nodeRefs.container.getBoundingClientRect();
    const dims = getPlotDimensions(rect);
    const { xScale, yScale } = getScales(plot.get('data').extent, dims);
    const lines = data.traces.map(trace => {
      const line =
        d3.line()
          .x(i => xScale(data.domain[i]))
          .y(i => yScale(trace[i]))
      ;
      const graphArea = d3.select(this.nodeRefs.svg)
        .append('g')
        .attr('transform', `translate(${dims.left}, ${dims.top})`)
      const svgline = graphArea.append('path')
        .datum(indices)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1)
        .attr('d', line)
      ;
      if (setRefs instanceof Function) {
        setRefs({ graphArea });
      }
      return { svgline, line };
    });
    this.updatePlot = () => {
      lines.forEach(({ svgline, line }) => {
        svgline
          .datum(indices)
          .attr('d', line)
        ;
      });
    };
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

const SVGPlot = ({ cursorFreq, setCursorFreq, setPlotState, ...props }) =>
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
