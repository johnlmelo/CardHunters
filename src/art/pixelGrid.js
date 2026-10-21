/* Grade de pixels quadrada com primitivas de desenho (retângulo e elipse) sobre uma paleta. */
import { MONSTER_PALETTE } from './palettes.js';

export function createPixelGrid(size, palette = MONSTER_PALETTE) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const inside = (i, j) => i >= 0 && i < size && j >= 0 && j < size;
  const rect = (x, y, w, h, c) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inside(i, j)) grid[j][i] = palette[c];
  };
  const ellipse = (cx, cy, rx, ry, c) => {
    for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
      const dx = (i - cx) / rx, dy = (j - cy) / ry;
      if (dx * dx + dy * dy <= 1.05 && inside(i, j)) grid[j][i] = palette[c];
    }
  };
  return { grid, rect, ellipse };
}

export const OUTLINE_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
