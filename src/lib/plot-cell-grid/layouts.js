const injectComponentsWhereNull = (layout, nullFillers = []) => {
  let fillerIndex = 0;
  for (let i = 0; i < layout.length; i++) {
    for(let j = 0; j < layout[i].length; j++) {
      if (nullFillers.length <= fillerIndex) {
        return;
      }
      if (!layout[i][j]) {
        layout[i][j] = nullFillers[fillerIndex++];
      }
    }
  }
};

// Consider using nested children to distinguish plots and fillers.
export const listToScalpLayout = (children, ...nullFillers) => {
  const layout = [
    [null,         children[0], null,         children[1], null],
    [children[10], children[2], children[16], children[3], children[11]],
    [children[12], children[4], children[17], children[5], children[13]],
    [children[14], children[6], children[18], children[7], children[15]],
    [null,         children[8], null,         children[9], null]
  ];
  injectComponentsWhereNull(layout, nullFillers);
  return layout;
};

// Consider using nested children to distinguish plots and totals.
export const listToMatrixLayout = (children, totals) => {
  let row = -1;
  return children.reduce((layout, child, i) => {
    if (i % 5 === 4) {
      layout[row].push(totals[row] || null);
      row++;
      layout.push([]);
      row++;
    }
    layout[row].push(child);
    return layout;
  }, []);
};
