import React from 'react';
import './Plot.css';

export const Plot = ({ setRefs, plotStyle, children, ...props }) => {
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
      className="plot-container noselect"
      style={plotStyle}
      ref={container => setRefs instanceof Function && setRefs({ container })}
      {...props}
    >
      {reffedChildren}
    </div>
  );
}
