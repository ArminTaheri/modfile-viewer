export class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = r;
    this.b = b;
  }
  getRGB() {
    return [this.r, this.g, this.b];
  }
}

export const DEFAULT_COLOR_MAP = [
  new Color(1, 0, 0),
  new Color(0, 1, 0),
  new Color(0, 0, 1)
];
