import React, { Component } from 'react';

export const enhanceWithRefs = ({ didMount, didUpdate, willUnmount }) => {
  return WrappedComponent => {
    return class Enhanced extends Component {
      constructor(props) {
        super(props);
        this.refs = {};
      }
      componentDidMount() {
        this.props.setRefs instanceof Function && this.props.setRefs(this.refs);
        didMount instanceof Function && didMount(this.refs)
      }
      componentDidUpdate() {
        didUpdate instanceof Function && didUpdate(this.refs)
      }
      componentWillUnmount() {
        willUnmount instanceof Function && willUnmount(this.refs)
      }
      render() {
        const { setRefs, ...restProps } = this.props;
        return (
          <WrappedComponent
            setRefs={refs => { Object.assign(this.refs, refs); }}
            {...restProps}
          />
        );
      }
    }
  };
}

export const createPlotElements = ({ setRefs }) =>
  <div ref={container => setRefs({ container })}>
    <svg ref={svg => setRefs({ svg })}></svg>
    <canvas ref={canvas => setRefs({ canvas })}></canvas>
  </div>
