/* Ruído determinístico usado na geração e na pintura do mundo. */

export function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Hash inteiro de (x, y, semente) para [0, 1). */
export function h2(x, y, s = 0) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Ruído de valor suavizado. */
export function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Ruído fractal (soma de oitavas). */
export function fbm(x, y, s = 0, o = 3) {
  let t = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { t += vnoise(x * f, y * f, s + i * 17) * amp; n += amp; amp *= 0.5; f *= 2; }
  return t / n;
}
