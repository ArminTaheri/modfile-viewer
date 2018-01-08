import ResizeObserver from 'resize-observer-polyfill';
import React  from 'react';
import PropTypes from 'prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { setPropTypes, renderComponent, compose, branch } from 'recompose';
import * as d3 from 'd3';
import { enhanceWithRefs } from './enhanceWithRefs';
import { Plot } from './plot/Plot';
import { PlotCellGrid } from './plot-cell-grid/PlotCellGrid';
import { PlotData } from './PlotData';

const setPlotPropTypes = setPropTypes({
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
    dimensions: ImmutableTypes.contains({
      width: PropTypes.number,
      height: PropTypes.number
    }),
    data: PropTypes.instanceOf(PlotData)
  }).isRequired,
  setPlotState: PropTypes.func.isRequired
})

const Loading = () => <div>Loading...</div>
const showLoading = branch(({ plot }) => !plot.has('data'), renderComponent(Loading))

// Drawing enhancers:

const PADDING = 40;
const getScales = ({ top, left, width, height }) => {
  const xScale = d3.scaleLinear()
    .domain([0, 50])
    .rangeRound([0, width - 100])
  ;
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .rangeRound([height / 2, 0])
  ;
  const xInvScale = d3.scaleLinear()
    .domain([0, width - 100])
    .range([0, 50])
  ;
  const yInvScale = d3.scaleLinear()
    .domain([height / 2, 0])
    .range([0, 100])
  ;
  return { xScale, yScale, xInvScale, yInvScale };
};

const getDimensions = (padding, rect) => ({
  left: padding,
  top: padding,
  width: rect.width,
  height: rect.height
});

const axisBottom = enhanceWithRefs({
  didMount() {
    let axis = null;
    this.updatePlot = () => {
      const { plot } = this.props;
      const rect = this.refs.container.getBoundingClientRect();
      const dims = getDimensions(PADDING, rect);
      const { xScale } = getScales(dims);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'bottom' orientation, draw the axis.
      if (plot.get('axes').map(a => a.get('orientation')).includes('bottom')) {
        const axisFunc = d3.axisBottom(xScale).ticks(5);
        axis =
          d3.select(this.refs.svg)
            .append('g')
            .attr('transform', `translate(${dims.left}, ${dims.height / 2 + dims.top})`)
            .call(axisFunc)
        ;
      }
    }
    this.updatePlot();
  },
  didUpdate() {
    this.updatePlot instanceof Function && this.updatePlot();
  }
})

const axisLeft = enhanceWithRefs({
  didMount() {
    let axis = null;
    this.updatePlot = () => {
      const { plot } = this.props;
      const rect = this.refs.container.getBoundingClientRect();
      const dims = getDimensions(PADDING, rect);
      const { yScale } = getScales(dims);
      if (axis) {
        axis.remove();
        axis = null;
      }
      // If any plot axes has a 'left' orientation, draw the axis.
      if (plot.get('axes').map(a => a.get('orientation')).includes('left')) {
        const axisFunc = d3.axisLeft(yScale).ticks(5);
        axis =
          d3.select(this.refs.svg)
            .append('g')
            .attr('transform', `translate(${dims.left}, ${dims.top})`)
            .call(axisFunc)
        ;
        return;
      }
    }
    this.updatePlot();
  },
  didUpdate() {
    this.updatePlot instanceof Function && this.updatePlot();
  }
})

const curves = enhanceWithRefs({
  didMount() {
    this.updatePlot = () => {
    };
    this.updatePlot();
  },
  didUpdate() {
    this.updatePlot instanceof Function && this.updatePlot();
  }
})

const updateOnResize = enhanceWithRefs({
  didMount() {
    this.resizeObserver = new ResizeObserver(() => { this.forceUpdate(); });
    this.resizeObserver.observe(this.refs.container);
  }
})

const ModFilePlot = compose(
  setPlotPropTypes,
  showLoading,
  // enhanceWithRefs() needs to be applied together to pass react refs between each other.
  updateOnResize,
  axisLeft,
  axisBottom,
  curves
)(Plot)

export const ModFileViewer = ({ setPlotsState, plots }) => {
  const plotElements = plots.map((plot, i) =>
    <ModFilePlot
      plotStyle={{ display: 'flex', minWidth: '100%', minHeight: '100%' }}
      plot={plot}
      setPlotState={newPlot => setPlotsState(plots.set(i, newPlot))}
    />
  );
  return (
    <PlotCellGrid>
      {plotElements.toJS()}
    </PlotCellGrid>
  )
}
