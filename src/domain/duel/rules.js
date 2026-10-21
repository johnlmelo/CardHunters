/*
 * Regras do duelo (funções puras sobre o estado de cada lado).
 * - O Cativo ataca no turno em que entra, exceto no primeiro turno do duelo (s.noAtk).
 * - Sem ataque direto: só Cativos podem ser alvo.
 * - Ataque contra defesa: maior destrói e o excedente fere o dono; igual só destrói; menor é bloqueado.
 * - O dano que não destrói fica acumulado no Cativo até ele sair de campo (evita empates).
 */
import { CARDS } from '../../data/cards.js';
import { BEATS } from '../../data/types.js';
import { DECK_SIZE, FIELD_SIZE, MAX_ENERGY } from '../../config/constants.js';
import { shuffle } from '../../core/random.js';
import { asEntry, statsOf } from '../equipment.js';

let uid = 0;

/** Cria a unidade em campo a partir de uma entrada de deck. */
export function unit(e) {
  e = asEntry(e);
  const s = statsOf(e);
  return { ...CARDS[e.k], k: e.k, items: e.items, atk: s.atk, def: s.def, ab: s.ab, shield: !!s.ab.escudo, wear: 0, sick: false, rush: !!s.ab.investida, moved: false, done: false, u: ++uid };
}

export const defLeft = d => d.def - (d.wear || 0);

export const newSide = (entries, life) => ({
  life, maxLife: life,
  deck: shuffle(entries.map(asEntry)).slice(0, DECK_SIZE),
  hand: [], field: Array(FIELD_SIZE).fill(null), e: 0, maxE: 0,
});

export function draw(s, n = 1) {
  for (let i = 0; i < n; i++) if (s.deck.length) s.hand.push(s.deck.pop());
}

export function beginTurn(s, skipDraw) {
  s.noAtk = !!skipDraw;
  s.maxE = Math.min(MAX_ENERGY, s.maxE + 1);
  s.e = s.maxE;
  if (!skipDraw) draw(s);
  s.field.forEach(u => {
    if (!u) return;
    if (u.rushOn) { u.atk -= 1; u.rushOn = false; }
    u.sick = false; u.moved = false; u.done = false;
  });
}

/** Dano com vantagem de tipo (+50%). */
export const dmg = (a, d) => (BEATS[a.type] === d.type ? Math.ceil(a.atk * 1.5) : a.atk);

export const cardsLeft = s => s.deck.length + s.hand.length + s.field.filter(Boolean).length;
export const canAttack = u => !!u && !u.sick && !u.done;
export const fieldEmpty = s => s.field.every(x => !x);

export function validTargets(att, def, i) {
  const u = att.field[i];
  if (!canAttack(u)) return [];
  const t = [];
  def.field.forEach((x, j) => { if (x) t.push(j); });
  return t;
}

export function playCard(s, h, slot) {
  const e = s.hand.splice(h, 1)[0];
  s.e -= CARDS[e.k].cost;
  const u = unit(e);
  if (u.rush) { u.atk += 1; u.rushOn = true; }
  u.sick = !!s.noAtk && !u.rush;
  s.field[slot] = u;
  return u;
}

/** Simula o resultado de `u` atacando `d`, sem alterar nada. */
export function preview(u, d) {
  let x = dmg(u, d);
  if (u.ab.espelho) x = Math.max(x, d.atk);
  let left = defLeft(d);
  if (u.ab.perfurar) left = Math.max(0, left - 2);
  const counter = !!d.ab.contra && dmg(d, u) >= defLeft(u);
  if (d.shield) return { x, left, shielded: true, killed: false, pierce: 0, counter };
  const killed = x >= left;
  return { x, left, shielded: false, killed, pierce: killed ? x - left : 0, counter };
}

/** Executa o ataque do Cativo `i` de `att` contra o alvo `t` de `def`. */
export function resolve(att, def, i, t) {
  const u = att.field[i];
  u.done = true;
  if (t === 'face') { def.life -= u.atk; return { face: true, dmg: u.atk, u }; }
  const d = def.field[t], pv = preview(u, d), gain = {};
  if (pv.shielded) d.shield = false;
  else if (pv.killed) {
    def.field[t] = null;
    def.life -= pv.pierce;
    if (u.ab.saque) { att.e += 1; gain.saque = 1; }
    if (u.ab.sangue && att.life < att.maxLife) { att.life += 1; gain.sangue = 1; }
  } else d.wear = (d.wear || 0) + pv.x;
  if (pv.counter) att.field[i] = null;
  return { u, d, dmg: pv.x, def: pv.left, adv: dmg(u, d) > u.atk, killed: pv.killed, pierce: pv.pierce, shielded: pv.shielded, died: pv.counter, gain };
}
