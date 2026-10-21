/* Conversão de artes em canvas (texturas para o Phaser). */
import { hexToRgb } from './color.js';
import { GROUND_PALETTE as GP } from './palettes.js';

/** Matriz de cores hex (ou null) → canvas. */
export function artCanvas(a) {
  const h = a.length, w = a[0].length, cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  a.forEach((row, y) => row.forEach((c, x) => {
    if (!c) return;
    const i = (y * w + x) * 4, [r, g, b] = hexToRgb(c);
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }));
  ctx.putImageData(img, 0, 0);
  return cv;
}

/** Gradiente radial quadrado (luzes, nuvens, escuridão). */
export function radialCanvas(size, stops) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d'), g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return cv;
}

/** Tile de mar aberto com ondinhas, para repetir ao redor da ilha. */
export function waterTileCanvas() {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let c = GP.agua[0];
    if (((y + ((Math.sin(x / 64 * Math.PI * 2) * 3) | 0)) % 16 === 0) && ((x >> 3) & 1)) c = GP.agua[2];
    const i = (y * s + x) * 4;
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/** Desenha uma matriz de cores num contexto 2D, pixel a pixel, com deslocamento. */
export function paintPixels(ctx, a, ox = 0, oy = 0) {
  a.forEach((row, y) => row.forEach((c, x) => { if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); } }));
}
