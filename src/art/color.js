/* Conversões de cor e rampas de sombreamento. */

export const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function hex2hsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  }
  return [h, s, l];
}

export function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

/** Gira o matiz `h` em direção a `t`, no máximo `d` graus. */
const toward = (h, t, d) => { const diff = ((t - h + 540) % 360) - 180; return h + Math.sign(diff) * Math.min(Math.abs(diff), d); };

const RAMPS = {};
/**
 * Rampa de 5 tons a partir de uma cor base: [sombra, meia-sombra, base, luz, contorno].
 * Sombras puxam para o azul, luzes para o amarelo.
 */
export function ramp(hex) {
  if (RAMPS[hex]) return RAMPS[hex];
  const [h, s, l] = hex2hsl(hex);
  return RAMPS[hex] = [
    hsl2hex(toward(h, 235, 5), Math.min(1, s * 1.02 + 0.03), l * 0.66),
    hsl2hex(toward(h, 235, 4), s, l * 0.85),
    hex,
    hsl2hex(toward(h, 50, 8), s * 0.92, l + (1 - l) * 0.38),
    hsl2hex(toward(h, 235, 16), Math.min(1, s * 0.9 + 0.1), l * 0.3),
  ];
}
