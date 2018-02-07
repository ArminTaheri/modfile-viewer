export class ColorMap {
  constructor(resolution, colorStops) {
    this.resolution = resolution;
    const canvas = document.createElement('canvas');
    canvas.width = this.resolution;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    colorStops.forEach((stop, i) => {
      grad.addColorStop(stop.t, stop.color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.map = new Uint32Array(imageData.data.buffer);
  }
  interpolate(t) {
    return this.map[Math.floor((t / 2 + 0.5) * this.resolution)];
  }
}

export const DEFAULT_COLOR_MAP = [
  { t: 0.00, color: '#ff0000' }, // bottom
  { t: 0.50, color: '#ffffff' },
  { t: 1.00, color: '#0000ff' }, // top
];
