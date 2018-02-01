import Heap from 'collections/heap';

export class FreqPlotData {
  static extent = { x: [Infinity, -Infinity], y: [Infinity, -Infinity] }
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
      y: [Infinity, -Infinity]
    };
  }
  // Use an external reference as the extent of the plot.
  setExtent(extent) {
    this.extent = extent;
    return this;
  }
  addTrace(buffer) {
    const bufmin = buffer.reduce((x, y) => Math.min(x, y), Infinity);
    const bufmax = buffer.reduce((x, y) => Math.max(x, y), -Infinity);
    this.extent.y[0] = Math.floor(Math.min(this.extent.y[0], bufmin));
    this.extent.y[1] = Math.ceil(Math.max(this.extent.y[1], bufmax));
    this.traces.push(buffer);
    return this;
  }
}

function project(theta, phi) {
  return [
    Math.sin(phi) * Math.cos(theta),
    -Math.sin(phi) * Math.sin(theta)
  ];
}

const PI = Math.PI;
const positions1020 = {
  'Fp1-AVR': project(-0.4 * PI, -0.5 * PI),
  'Fp2-AVR': project(0.4 * PI, 0.5 * PI),
  'F3-AVR': project(-0.25 * PI, 0.25 * PI),
  'F4-AVR': project(0.25 * PI, 0.25 * PI),
  'C3-AVR': project(0, -0.25 * PI),
  'C4-AVR': project(0, 0.25 * PI),
  'P3-AVR': project(0.25 * PI, -0.25 * PI),
  'P4-AVR': project(-0.25 * PI, -0.25 * PI),
  'O1-AVR': project(0.4 * PI, -0.5 * PI),
  'O2-AVR': project(-0.4 * PI, 0.5 * PI),
  'F7-AVR': project(-0.2 * PI, -0.5 * PI),
  'F8-AVR': project(0.2 * PI, 0.5 * PI),
  'T3-AVR': project(0, -0.5 * PI),
  'T4-AVR': project(0, 0.5 * PI),
  'T5-AVR': project(0.2 * PI, -0.5 * PI),
  'T6-AVR': project(-0.2 * PI, 0.5 * PI),
  'FZ-AVR': project(0.5 * PI, 0.2 * PI),
  'CZ-AVR': project(0, 0),
  'PZ-AVR': project(-0.5 * PI, 0.2 * PI),
}

function distance(v1, v2) {
  const x = (v2[0] - v1[0]);
  const y = (v2[1] - v1[1]);
  return x*x + y*y;
}


export class CorrelationPlotData {
  constructor(labels, correlations, startFreq, stepSize, label=null, units='uV^2/Hz') {
    this.label = label;
    this.units = units;
    this.labels = labels.map(l => l.replace(/ /g, ''));
    this.labelIndices = this.labels.map((_, i) => i);
    this.correlations = correlations;
    this.weights = new Float32Array(this.labels.length);
    this.startFreq = startFreq;
    this.stepSize = stepSize;
    this.extent = [Infinity, -Infinity];
    this.correlations.forEach(correlation => {
      correlation.forEach(freq => {
        this.extent[0] = this.extent[0] > freq ? freq : this.extent[0];
        this.extent[1] = this.extent[1] < freq ? freq : this.extent[1];
      });
    });
    this.compareWeightOfIndices = this.compareWeightOfIndices.bind(this);
  }
  compareWeightOfIndices(a, b) {
    return this.weights[a] - this.weights[b];
  }
  setExtent(min, max) {
    this.extent[0] = min;
    this.extent[1] = max;
    return this;
  }
  interpolate(k, frequency, point) {
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = 1 / distance(point, positions1020[this.labels[i]]);
    }
    let intensity = 0;
    let wsum = 0;
    const indexHeap = new Heap(this.labelIndices, null, this.compareWeightOfIndices);
    const clampedK = Math.min(k, this.weights.length);
    for (let i = 0; i < clampedK; i++) {
      const nearestIndex = indexHeap.pop();
      const freqIndex = Math.floor(Math.max((frequency - this.startFreq)/ this.stepSize, 0));
      if (freqIndex < 0 || freqIndex >= this.correlations.length) {
        continue;
      }
      const absp = this.correlations[freqIndex][nearestIndex];
      const midpoint = (this.extent[1] + this.extent[0]) / 2;
      intensity +=  2 * this.weights[nearestIndex] * (absp - midpoint) / (this.extent[1] - this.extent[0]);
      wsum += this.weights[nearestIndex];
    }
    return intensity / wsum;
  }
}
