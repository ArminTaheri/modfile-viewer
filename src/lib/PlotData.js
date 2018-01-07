export class PlotData {
  constructor() {
    this.domain = new Float32Array(1000);
    this.range = new Float32Array(1000);
  }
  loadFrom(file) {
    console.warn('Use real files here: ', file);
    // NOTE: Generate fake data for now
    const bounds = { min: 0, max: 50 };
    this.domain.forEach((_, i) => {
      const t = i / this.domain.length;
      this.domain[i] = bounds.min * (1 - t) + bounds.max * t;
    });
    this.range.forEach((_, i) => {
      this.range[i] = Math.random() * 100;
    });
    return this;
  }
}
