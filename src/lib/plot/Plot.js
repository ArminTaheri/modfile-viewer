import React, { Component } from 'react';
import './Plot.css';

export const Plot = ({ setRefs, plotClass, children, ...props }) => {
  const setNodeNameRef = node => {
    if (!(setRefs instanceof Function && node)) {
      return;
    }
    const refs = {};
    refs[node.nodeName.toLowerCase()] = node;
    setRefs(refs)
  };
  const reffedChildren = React.Children.map(children, child =>
    React.cloneElement(child, {ref: setNodeNameRef})
  );
  return (
    <div
      className={`plot-container noselect ${plotClass || ''}`}
      ref={container => setRefs instanceof Function && setRefs({ container })}
      {...props}
    >
      {reffedChildren}
    </div>
  );
}

// TODO: Remove this HOC and follow code style of plot/CorrelationPlot.js
export const enhanceWithRefs = ({ didMount, didUpdate, willUnmount }) => {
  return WrappedComponent => {
    return class Enhanced extends Component {
      constructor(props) {
        super(props);
        this.nodeRefs = {};
      }
      componentDidMount() {
        this.props.setRefs instanceof Function && this.props.setRefs(this.refs);
        didMount instanceof Function && didMount.call(this);
      }
      componentDidUpdate() {
        this.updatePlot instanceof Function && this.updatePlot();
        didUpdate instanceof Function && didUpdate.call(this);
      }
      componentWillUnmount() {
        willUnmount instanceof Function && willUnmount.call(this);
      }
      render() {
        const { setRefs, ...restProps } = this.props;
        const propagateRefs = refs => {
          Object.assign(this.nodeRefs, refs);
          if (this.props.setRefs instanceof Function) {
            this.props.setRefs(this.nodeRefs);
          }
        }
        return (
          <WrappedComponent
            setRefs={propagateRefs}
            {...restProps}
          />
        );
      }
    }
  };
}
