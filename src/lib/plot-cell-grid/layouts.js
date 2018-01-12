const injectComponentsWhereNull = (layout, nullFillers = []) => {
  let fillerIndex = 0;
  for (let i = 0; i < layout.length; i++) {
    for(let j = 0; j < layout[i].length; j++) {
      if (nullFillers.length <= fillerIndex) {
        return;
      }
      if (layout[i][j] === null) {
        layout[i][j] = nullFillers[fillerIndex++];
      }
    }
  }
};

export const listToScalpLayout = (children, ...nullFillers) => {
  const layout = [
    [null, children[0], null, children[1], null],
    [children[10], children[3], children[4], children[5], children[6]],
    [children[7], children[8], children[9], children[2], children[11]],
    [children[12], children[13], children[14], children[15], children[16]],
    [null, children[17], null, children[18], null]
  ];
  injectComponentsWhereNull(layout, nullFillers);
  return layout;
};
