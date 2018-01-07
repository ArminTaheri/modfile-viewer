import React, { Component } from 'react';

export const enhanceWithRefs = ({ didMount, didUpdate, willUnmount }) => {
  return WrappedComponent => {
    return class Enhanced extends Component {
      constructor(props) {
        super(props);
        this.refs = {};
      }
      arguments() {
        return {
          props: this.props,
          state: this.state, // NOTE: please don't use this argument
          refs: this.refs
        };
      }
      componentDidMount() {
        this.props.setRefs instanceof Function && this.props.setRefs(this.refs);
        didMount instanceof Function && didMount.call(this);
      }
      componentDidUpdate() {
        didUpdate instanceof Function && didUpdate.call(this);
      }
      componentWillUnmount() {
        willUnmount instanceof Function && willUnmount.call(this);
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

export const Plot = ({ setRefs }) =>
  <div ref={container => setRefs({ container })}>
    <svg ref={svg => setRefs({ svg })}></svg>
    <canvas ref={canvas => setRefs({ canvas })}></canvas>
  </div>
