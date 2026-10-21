/* Busca de caminhos: alcance, caminho mais curto (andar) e caminho de menor custo (estradas). */
import { N4 } from '../core/math.js';
import { h2 } from '../core/noise.js';
import { walkOn } from './tiles.js';

/** Conjunto "x,y" de tiles alcançáveis a partir de (sx, sy). */
export function reachOf(m, sx, sy) {
  const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy, k = X + ',' + Y;
      if (!seen.has(k) && walkOn(m, X, Y)) { seen.add(k); q.push([X, Y]); }
    }
  }
  return seen;
}

/** Caminho mais curto (BFS) de (sx, sy) até (tx, ty), sem o ponto inicial. */
export function findPath(m, sx, sy, tx, ty) {
  if (!walkOn(m, tx, ty)) return null;
  const prev = new Map(), k = (x, y) => x + ',' + y, q = [[sx, sy]];
  prev.set(k(sx, sy), null);
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy;
      if (walkOn(m, X, Y) && !prev.has(k(X, Y))) { prev.set(k(X, Y), [x, y]); q.push([X, Y]); }
    }
  }
  if (!prev.has(k(tx, ty))) return null;
  const out = [];
  let c = [tx, ty];
  while (c && !(c[0] === sx && c[1] === sy)) { out.unshift(c); c = prev.get(k(c[0], c[1])); }
  return out;
}

/** Caminho de menor custo (Dijkstra com custo ruidoso) para gerar estradas sinuosas. */
export function cheapPath(m, sx, sy, tx, ty, ok) {
  const W = m.W, H = m.H, dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1), heap = [];
  const push = (c, i) => {
    heap.push([c, i]);
    let j = heap.length - 1;
    while (j > 0) { const p = (j - 1) >> 1; if (heap[p][0] <= heap[j][0]) break; [heap[p], heap[j]] = [heap[j], heap[p]]; j = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let j = 0;
      for (;;) {
        const l = 2 * j + 1, r = l + 1;
        let s = j;
        if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
        if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
        if (s === j) break;
        [heap[s], heap[j]] = [heap[j], heap[s]];
        j = s;
      }
    }
    return top;
  };
  dist[sy * W + sx] = 0;
  push(0, sy * W + sx);
  while (heap.length) {
    const [c, i] = pop();
    if (c > dist[i]) continue;
    const x = i % W, y = (i / W) | 0;
    if (x === tx && y === ty) break;
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= H || !ok(X, Y)) continue;
      const j = Y * W + X, nc = c + 1 + h2(X, Y, 77) * 2.2 + (m.road[Y][X] ? -0.6 : 0);
      if (nc < dist[j]) { dist[j] = nc; prev[j] = i; push(nc, j); }
    }
  }
  const out = [];
  let i = ty * W + tx;
  if (prev[i] < 0 && !(sx === tx && sy === ty)) return out;
  while (i >= 0) { out.push([i % W, (i / W) | 0]); i = prev[i]; }
  return out;
}
