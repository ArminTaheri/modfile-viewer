export class FreqPlotData {
  constructor(startFreq, stepSize, steps, label) {
    this.label = label;
    this.domain = new Float32Array(steps);
    let freq = startFreq;
    this.domain.forEach((_, i) => {
      this.domain[i] = freq;
      freq += stepSize;
    });
    this.traces = [];
    this.extent = {
      x: [0, this.domain[steps - 1]],
      y: [-1, 1]
    };
  }
  addTrace(buffer) {
    const bufmin = buffer.reduce((x, y) => Math.min(x, y), Infinity);
    const bufmax = buffer.reduce((x, y) => Math.max(x, y), -Infinity);
    if (this.traces.length === 0) {
      this.extent.y = [bufmin, bufmax];
    } else {
      this.extent.y[0] = Math.min(this.extent.y[0], bufmin);
      this.extent.y[1] = Math.min(this.extent.y[1], bufmax);
    }
    this.traces.push(buffer);
    return this;
  }
}

export class CorrelationPlotData {
  constructor(label) {
    this.label = label;
    this.intensityBuffer = new Float32Array(1);
  }
}
