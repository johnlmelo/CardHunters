/* Regras de tiles de um mapa: o que bloqueia, o que é passagem falsa e como colocar objetos. */
import { TILE as T } from '../config/constants.js';

/** Biomas que não se pode atravessar. */
export const BLOCK_BIO = { agua: 1, raso: 1, parede: 1, poca: 1 };
/** Obstáculos que parecem sólidos mas deixam passar (segredos). */
export const FAKE = { arvore_falsa: 1, rocha_falsa: 1 };

export const isWatery = b => b === 'agua' || b === 'raso' || b === 'poca';

export function walkOn(m, x, y) {
  return x >= 0 && y >= 0 && x < m.W && y < m.H && !BLOCK_BIO[m.bio[y][x]] && !(m.obs[y][x] && !FAKE[m.obs[y][x]]);
}

/** Tile livre para receber algo durante a geração. */
export const tileFree = (m, x, y) =>
  x > 0 && y > 0 && x < m.W - 1 && y < m.H - 1 && !BLOCK_BIO[m.bio[y][x]] && m.bio[y][x] !== 'pier' && !m.obs[y][x] && !m.road[y][x] && !m.lock[y][x];

export function addProp(m, k, x, y, o = {}) {
  m.props.push({ k, px: o.px ?? x * T + 16, py: o.py ?? y * T + 30, tx: x, ty: y, fake: !!o.fake, flat: !!o.flat, shadow: o.shadow ?? 1, glow: o.glow || null });
}

/** Marca o tile como obstáculo e, se pedido, desenha um objeto nele. */
export function block(m, x, y, kind, prop, o) {
  m.obs[y][x] = kind;
  if (prop) addProp(m, prop, x, y, o);
}
