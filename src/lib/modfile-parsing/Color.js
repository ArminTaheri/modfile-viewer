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
    this.map = imageData.data;
  }
  interpolate(t) {
    const index = Math.floor((t / 2 + 0.5) * this.resolution);
    return [
      this.map[index * 4 + 0],
      this.map[index * 4 + 1],
      this.map[index * 4 + 2],
      0xff
    ];
  }
}

export const DEFAULT_COLOR_MAP = [
  { t: 0.00, color: '#0000ff' }, // bottom
  { t: 0.20, color: '#00ffff' },
  { t: 0.40, color: '#00ff00' },
  { t: 0.60, color: '#00ff00' },
  { t: 0.80, color: '#ffff00' },
  { t: 1.00, color: '#ff0000' }, // top 
];
