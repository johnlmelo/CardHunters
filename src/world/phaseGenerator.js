/*
 * Geração procedural de uma fase (região com mapa próprio): terra cercada de mar, chegada de
 * barco ao sul, chefe no ponto mais distante, estradas com bifurcações, lagos, vegetação densa
 * formando trilhas, cavernas, áreas secretas, baús e duelistas.
 * Configuração em PHASES[].gen (data/phases.js).
 */
import { TILE as T } from '../config/constants.js';
import { N4 } from '../core/math.js';
import { fbm, h2 } from '../core/noise.js';
import { mulberry32 } from '../core/random.js';
import { phaseMapId } from '../data/phases.js';
import { CAVES, GUARDIAN_NAMES, REGION_NAMES, REGION_TYPE } from '../data/world.js';
import { cheapPath, reachOf } from './pathfinding.js';
import { BLOCK_BIO, FAKE, addProp, block, tileFree } from './tiles.js';

/** Raio sem obstáculos em volta da chegada. */
const START_CLEAR = 4;
/** Ramais de estrada além da principal (chegada → chefe). */
const ROAD_BRANCHES = 3;
/** Obstáculos que podem ser removidos para abrir caminho. */
const CARVABLE = { arvore: 1, rocha: 1, palmeira: 1, pilar: 1, estatua: 1, barril: 1, poste: 1 };
const SECRET_NAMES = { arvore: ['Clareira Escondida', 'Bosque Secreto'], rocha: ['Jardim de Pedra', 'Círculo de Pedras'] };
const CAVE_PROP = { mare: 'caverna_mare', raiz: 'caverna_raiz', mina: 'caverna_mina', cripta: 'escada' };

const land = (m, x, y) => !!m.bio[y] && m.bio[y][x] !== undefined && !BLOCK_BIO[m.bio[y][x]];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function generatePhase(phase) {
  const g = phase.gen, P = phase.reg, { W, H } = g, rnd = mulberry32(g.seed);
  const grid = v => Array.from({ length: H }, () => Array(W).fill(v));
  const m = {
    id: phaseMapId(phase.id), phaseId: phase.id, name: REGION_NAMES[P], W, H, water: true, dark: false,
    bio: grid(''), obs: grid(0), reg: grid(P), road: grid(0), lock: grid(0), special: grid(0),
    props: [], chests: [], npcs: [], portals: [], secrets: [], caveSpots: {},
  };
  shapeLand(m, g, P);
  const beach = placePier(m);
  addLakes(m, g, P);
  const landReach = landReachOf(m, m.start);
  const boss = farthest(landReach, m.start);
  lockArea(m, boss.x, boss.y, 2);
  layRoads(m, rnd, landReach, boss);
  if (P === 'porto') buildVillage(m, rnd, beach);
  const pois = [m.start, boss];
  placeCaves(m, rnd, g.caves, P, landReach, pois);
  placeSecrets(m, rnd, phase, landReach, pois);
  growVegetation(m, rnd, g, P);
  linkFakePassages(m);
  ensureReachable(m, [...m.portals, ...m.fakeLinks.map(f => ({ x: f.fx, y: f.fy })), boss]);
  const reach = reachOf(m, m.start.x, m.start.y);
  placeChestsAndDuelists(m, rnd, phase, reach, boss);
  computeDepth(m);
  return m;
}

/* ---------- terreno ---------- */

function shapeLand(m, g, P) {
  const { W, H } = m, cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x + 0.5 - cx) / (W / 2), ny = (y + 0.5 - cy) / (H / 2), d = Math.hypot(nx, ny), ang = Math.atan2(ny, nx);
    const edge = Math.min(0.9, 0.84 + 0.05 * Math.sin(ang * 3 + g.seed % 7) + 0.04 * Math.sin(ang * 7 + 1) + (fbm(x / 8, y / 8, g.seed) - 0.5) * 0.18);
    m.bio[y][x] = d > edge + 0.08 ? 'agua' : d > edge ? 'raso' : d > edge - 0.06 ? 'praia' : P;
  }
}

/** Píer ao sul: o herói chega de barco. Devolve o primeiro tile de praia. */
function placePier(m) {
  const { W, H } = m, sx = Math.floor(W / 2);
  let sy = H - 1;
  while (sy > 0 && m.bio[sy][sx] !== 'praia') sy--;
  let py = sy + 1, len = 0;
  while (py < H - 1 && len < 5 && BLOCK_BIO[m.bio[py][sx]]) { m.bio[py][sx] = 'pier'; py++; len++; }
  m.start = { x: sx, y: Math.max(sy, py - 1) };
  addProp(m, 'barco', sx + 1, py - 1, { px: (sx + 1) * T + 30, py: (py - 1) * T + 30, shadow: 0 });
  for (let y = sy - START_CLEAR; y <= m.start.y; y++) for (let x = sx - 2; x <= sx + 2; x++) if (m.lock[y]) m.lock[y][x] = 1;
  return { x: sx, y: sy };
}

/** Lagos internos (rasos na borda, fundos no meio), longe da chegada. */
function addLakes(m, g, P) {
  for (let y = 2; y < m.H - 2; y++) for (let x = 2; x < m.W - 2; x++) {
    if (m.bio[y][x] !== P || dist({ x, y }, m.start) < 10) continue;
    const n = fbm(x / 10, y / 10, g.seed + 9);
    if (n > g.lakes + 0.07) m.bio[y][x] = 'agua';
    else if (n > g.lakes) m.bio[y][x] = 'raso';
  }
}

/** Distâncias (BFS só por terra, ignorando obstáculos) a partir de `from`. */
function landReachOf(m, from) {
  const d = new Map([[from.x + ',' + from.y, 0]]), q = [[from.x, from.y]];
  while (q.length) {
    const [x, y] = q.shift(), cur = d.get(x + ',' + y);
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy, k = X + ',' + Y;
      if (!d.has(k) && land(m, X, Y)) { d.set(k, cur + 1); q.push([X, Y]); }
    }
  }
  return d;
}

function farthest(reach, from) {
  let best = from, bd = -1;
  for (const [k, d] of reach) if (d > bd) { bd = d; const [x, y] = k.split(',').map(Number); best = { x, y }; }
  return best;
}

const lockArea = (m, cx, cy, r) => {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (m.lock[y] && m.lock[y][x] !== undefined) m.lock[y][x] = 1;
};

/** Estrada principal até o chefe e ramais para pontos distantes. */
function layRoads(m, rnd, landReach, boss) {
  const ok = (x, y) => land(m, x, y);
  const mark = path => path.forEach(([x, y]) => { if (m.bio[y][x] !== 'pier') m.road[y][x] = 1; });
  const main = cheapPath(m, m.start.x, m.start.y, boss.x, boss.y, ok);
  mark(main);
  const tiles = [...landReach.keys()].map(k => k.split(',').map(Number));
  const ends = [m.start, boss];
  for (let b = 0; b < ROAD_BRANCHES; b++) {
    let target = null;
    for (let t = 0; t < 400 && !target; t++) {
      const [x, y] = tiles[Math.floor(rnd() * tiles.length)];
      if (ends.every(e => dist(e, { x, y }) > m.W / 4)) target = { x, y };
    }
    if (!target || !main.length) continue;
    ends.push(target);
    const [fx, fy] = main[Math.floor(rnd() * main.length)];
    mark(cheapPath(m, fx, fy, target.x, target.y, ok));
  }
}

/** Vila do porto perto da chegada: casas, poço e postes. */
function buildVillage(m, rnd, beach) {
  const near = (x, y, a, b) => { const d = dist({ x, y }, beach); return d >= a && d <= b; };
  let huts = 0;
  for (let t = 0; t < 1200 && huts < 4; t++) {
    const x0 = beach.x - 14 + Math.floor(rnd() * 28), y0 = beach.y - 12 + Math.floor(rnd() * 10);
    if (!near(x0 + 1, y0 + 1, 4, 15)) continue;
    let ok = true;
    for (let y = y0 - 1; y <= y0 + 2 && ok; y++) for (let x = x0 - 1; x <= x0 + 3 && ok; x++) if (!m.bio[y] || m.bio[y][x] !== 'porto' || !tileFree(m, x, y)) ok = false;
    if (!ok) continue;
    for (let y = y0; y < y0 + 2; y++) for (let x = x0; x < x0 + 3; x++) m.obs[y][x] = 'casa';
    addProp(m, 'casa', x0 + 1, y0 + 1, { px: (x0 + 1.5) * T, py: (y0 + 2) * T });
    for (let x = x0 - 1; x <= x0 + 3; x++) m.lock[y0 + 2][x] = 1;
    if (rnd() < 0.8 && tileFree(m, x0 + 3, y0 + 1)) block(m, x0 + 3, y0 + 1, 'barril', rnd() < 0.5 ? 'barril' : 'caixote');
    huts++;
  }
  let posts = 0;
  for (let y = 0; y < m.H && posts < 6; y++) for (let x = 0; x < m.W && posts < 6; x++) {
    if (!m.road[y][x] || !near(x, y, 2, 16) || h2(x, y, 3) <= 0.8) continue;
    const s = tileFree(m, x + 1, y) ? x + 1 : tileFree(m, x - 1, y) ? x - 1 : null;
    if (s !== null) { block(m, s, y, 'poste', 'poste', { glow: '#ffd95e' }); posts++; }
  }
  for (let t = 0; t < 200; t++) {
    const x = beach.x - 6 + Math.floor(rnd() * 12), y = beach.y - 8 + Math.floor(rnd() * 6);
    if (tileFree(m, x, y) && m.bio[y][x] === 'porto' && near(x, y, 4, 9)) { block(m, x, y, 'poco', 'poco'); break; }
  }
}

/* ---------- lugares especiais ---------- */

/** Entradas de caverna em pontos afastados entre si, da chegada e do chefe. */
function placeCaves(m, rnd, ids, P, landReach, pois) {
  const tiles = [...landReach.keys()].map(k => k.split(',').map(Number));
  for (const id of ids) {
    const style = CAVES[id].style;
    for (let t = 0; t < 4000; t++) {
      const [x, y] = tiles[Math.floor(rnd() * tiles.length)];
      if (m.bio[y][x] !== P || pois.some(p => dist(p, { x, y }) < 14)) continue;
      let ok = true;
      for (let yy = y - 2; yy <= y + 2 && ok; yy++) for (let xx = x - 2; xx <= x + 2 && ok; xx++) if (!tileFree(m, xx, yy)) ok = false;
      if (!ok || !land(m, x, y + 1)) continue;
      const ring = [[-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
      if (style === 'cripta') { block(m, x - 1, y, 'pilar', 'pilar'); block(m, x + 1, y, 'pilar', 'pilar'); }
      else for (const [dx, dy] of ring) m.obs[y + dy][x + dx] = 'rochedo';
      lockArea(m, x, y, 2);
      m.caveSpots[id] = { x, y };
      addProp(m, CAVE_PROP[style], x, y, style === 'cripta' ? { py: (y + 1) * T - 2, flat: true, shadow: 0 } : { py: (y + 1) * T, shadow: 0 });
      m.portals.push({ x, y, to: id, ax: null, ay: null });
      pois.push({ x, y });
      break;
    }
  }
}

/** Áreas fechadas por árvores ou rochas, com uma passagem disfarçada e um baú especial. */
function placeSecrets(m, rnd, phase, landReach, pois) {
  const P = phase.reg, used = {};
  m.fakeLinks = [];
  phase.gen.secrets.forEach((wall, i) => {
    const tiles = [...landReach.keys()].map(k => k.split(',').map(Number));
    for (let t = 0; t < 5000; t++) {
      const [x, y] = tiles[Math.floor(rnd() * tiles.length)];
      if (x < 5 || y < 5 || x > m.W - 6 || y > m.H - 6 || pois.some(p => dist(p, { x, y }) < 12)) continue;
      let ok = true;
      for (let yy = y - 4; yy <= y + 4 && ok; yy++) for (let xx = x - 4; xx <= x + 4 && ok; xx++) {
        if (Math.hypot(xx - x, yy - y) > 4.6) continue;
        if (m.bio[yy][xx] !== P || !tileFree(m, xx, yy)) ok = false;
      }
      if (!ok) continue;
      for (let yy = y - 4; yy <= y + 4; yy++) for (let xx = x - 4; xx <= x + 4; xx++) {
        const d = Math.hypot(xx - x, yy - y);
        m.lock[yy][xx] = 1;
        if (d < 2.6) m.special[yy][xx] = 1;
        else if (d < 3.7) block(m, xx, yy, wall, wall, {});
      }
      // passagem disfarçada: um tile da própria parede, com chão livre por dentro e por fora
      const walls = [];
      for (let yy = y - 4; yy <= y + 4; yy++) for (let xx = x - 4; xx <= x + 4; xx++) {
        const d = Math.hypot(xx - x, yy - y);
        if (d < 2.6 || d >= 3.7 || m.obs[yy][xx] !== wall) continue;
        // o herói anda em 4 direções: precisa de vizinho ortogonal livre dentro e fora do anel
        const nb = N4.map(([dx, dy]) => [xx + dx, yy + dy, Math.hypot(xx + dx - x, yy + dy - y)]);
        const inside = nb.some(([a, b, dd]) => dd < 2.6 && !m.obs[b][a]), outside = nb.some(([a, b, dd]) => dd >= 3.7 && !m.obs[b][a]);
        if (inside && outside) walls.push([xx, yy]);
      }
      const [fx, fy] = walls[Math.floor(rnd() * walls.length)];
      m.obs[fy][fx] = wall + '_falsa';
      const fp = m.props.find(p => p.tx === fx && p.ty === fy && p.k === wall);
      if (fp) fp.fake = true;
      m.fakeLinks.push({ x, y, fx, fy });
      const names = SECRET_NAMES[wall], n = used[wall] = (used[wall] || 0) + 1;
      m.secrets.push({ id: `${phase.id}:s${i}`, name: names[(n - 1) % names.length], x, y, r: 2.6 });
      m.chests.push({ id: `${phase.id}:s${i}`, x, y, reg: P, special: 1, boost: 40 });
      pois.push({ x, y });
      return;
    }
  });
}

/** Vegetação e pedras do bioma, densas o bastante para formar trilhas. */
function growVegetation(m, rnd, g, P) {
  for (let y = 1; y < m.H - 1; y++) for (let x = 1; x < m.W - 1; x++) {
    if (!tileFree(m, x, y) || dist({ x, y }, m.start) < START_CLEAR) continue;
    const b = m.bio[y][x], n = fbm(x / 6, y / 6, g.seed + 11), r = rnd();
    if (b === 'praia') { if (r < 0.04) block(m, x, y, 'palmeira', 'palmeira'); continue; }
    if (b !== P) continue;
    if (P === 'selva') { if ((n > 0.5 && r < 0.8) || r < 0.1) block(m, x, y, 'arvore', h2(x, y, 9) > 0.55 ? 'arvore2' : 'arvore'); }
    else if (P === 'minas') {
      if ((n > 0.5 && r < 0.72) || r < 0.08) block(m, x, y, 'rocha', h2(x, y, 9) > 0.75 ? 'rocha_ouro' : 'rocha');
      else if (r < 0.085) block(m, x, y, 'rocha', 'estalagmite');
    } else if (P === 'porto') {
      if ((n > 0.52 && r < 0.75) || r < 0.06) block(m, x, y, 'arvore', h2(x, y, 9) > 0.8 ? 'arvore2' : 'arvore');
      else if (r < 0.08) block(m, x, y, 'rocha', 'rocha');
      else if (r < 0.1) addProp(m, 'arbusto', x, y, { shadow: 0 });
    } else if (P === 'templo') {
      // ruínas: colunatas em fileiras, muros quebrados e bosques
      const wallRow = (y % 6 === 0 && fbm(x / 5, y, g.seed + 3) > 0.45) || (x % 7 === 0 && fbm(x, y / 5, g.seed + 4) > 0.5);
      if (wallRow && r < 0.85) block(m, x, y, 'pilar', r < 0.25 ? 'pilar_q' : 'pilar');
      else if ((n > 0.55 && r < 0.7) || r < 0.05) block(m, x, y, 'arvore', 'arvore');
      else if (r < 0.07) block(m, x, y, 'estatua', 'estatua');
    }
  }
}

/** Abre caminho para fora a partir de cada passagem disfarçada. */
function linkFakePassages(m) {
  for (const f of m.fakeLinks) {
    const dx = Math.sign(f.fx - f.x), dy = Math.sign(f.fy - f.y);
    if (!dx && !dy) continue;
    let x = f.fx, y = f.fy;
    for (let i = 0; i < 6; i++) {
      x += dx; y += dy;
      if (!m.obs[y] || m.obs[y][x] === undefined) break;
      if (m.obs[y][x] && !FAKE[m.obs[y][x]] && !m.lock[y][x]) clearTile(m, x, y);
    }
  }
}

function clearTile(m, x, y) {
  m.obs[y][x] = 0;
  m.props = m.props.filter(p => !(p.tx === x && p.ty === y));
}

/**
 * Garante que cada alvo seja alcançável a partir da chegada: quando não for, abre o
 * caminho mais curto por terra removendo vegetação e pedras soltas.
 */
function ensureReachable(m, targets) {
  let reach = reachOf(m, m.start.x, m.start.y);
  for (const t of targets) {
    if (reach.has(t.x + ',' + t.y)) continue;
    const prev = new Map([[m.start.x + ',' + m.start.y, null]]), q = [[m.start.x, m.start.y]];
    const passable = (x, y) => land(m, x, y) && (!m.obs[y][x] || FAKE[m.obs[y][x]] || (CARVABLE[m.obs[y][x]] && !m.lock[y][x]) || (x === t.x && y === t.y));
    while (q.length) {
      const [x, y] = q.shift();
      if (x === t.x && y === t.y) break;
      for (const [dx, dy] of N4) {
        const X = x + dx, Y = y + dy, k = X + ',' + Y;
        if (!prev.has(k) && passable(X, Y)) { prev.set(k, [x, y]); q.push([X, Y]); }
      }
    }
    let c = prev.has(t.x + ',' + t.y) ? [t.x, t.y] : null;
    while (c) {
      const [x, y] = c;
      if (m.obs[y][x] && CARVABLE[m.obs[y][x]]) clearTile(m, x, y);
      c = prev.get(x + ',' + y);
    }
    reach = reachOf(m, m.start.x, m.start.y);
  }
}

/* ---------- baús e duelistas ---------- */

function placeChestsAndDuelists(m, rnd, phase, reach, boss) {
  const g = phase.gen, P = phase.reg, type = REGION_TYPE[P];
  const tiles = [...reach].map(k => k.split(',').map(Number))
    .filter(([x, y]) => dist({ x, y }, m.start) > 6 && !m.special[y][x] && !m.road[y][x] && !m.lock[y][x]);
  const taken = [...m.chests, ...m.portals, boss, m.start].map(p => [p.x, p.y]);
  const pick = (n, minD) => {
    const out = [];
    for (let d = minD; d >= 3 && out.length < n; d--) {
      for (let t = 0; t < 3000 && out.length < n; t++) {
        const p = tiles[Math.floor(rnd() * tiles.length)];
        if (p && taken.every(o => Math.hypot(o[0] - p[0], o[1] - p[1]) >= d)) { out.push(p); taken.push(p); }
      }
    }
    return out;
  };
  pick(g.chests, g.chestGap).forEach(([x, y], i) => m.chests.push({ id: `${phase.id}:${i}`, x, y, reg: P, boost: g.boost }));
  pick(g.duelists.length, 7).forEach(([x, y], i) => m.npcs.push({ x, y, type, name: g.duelists[i], guardian: false, nid: `n_${phase.id}${i}`, look: type, reg: P }));
  if (g.extraGuardian) {
    const [p] = pick(1, 10);
    if (p) m.npcs.push({ x: p[0], y: p[1], ...g.extraGuardian, guardian: true, reg: P });
  }
  m.npcs.push({ x: boss.x, y: boss.y, type, name: GUARDIAN_NAMES[P], guardian: true, nid: phase.boss, look: phase.boss, reg: P });
}

/** Distância até a terra (profundidade da água), usada na pintura do mar. */
function computeDepth(m) {
  const { W, H } = m;
  m.depth = Array.from({ length: H }, () => Array(W).fill(99));
  const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!BLOCK_BIO[m.bio[y][x]]) { m.depth[y][x] = 0; q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of N4) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H && m.depth[Y][X] > m.depth[y][x] + 1) { m.depth[Y][X] = m.depth[y][x] + 1; q.push([X, Y]); }
    }
  }
}
