/* Inteligência do oponente: escolhe a próxima carta a jogar e o melhor ataque. */
import { CARDS } from '../../data/cards.js';
import { BEATS } from '../../data/types.js';
import { canAttack, dmg, preview, validTargets } from './rules.js';

/** Próxima carta a jogar (a mais cara que couber) e em qual espaço. */
export function aiNextPlay(o, p) {
  const free = o.field.map((x, s) => s).filter(s => !o.field[s]);
  if (!free.length) return null;
  const idx = o.hand.map((e, i) => i).filter(i => CARDS[o.hand[i].k].cost <= o.e).sort((a, b) => CARDS[o.hand[b].k].cost - CARDS[o.hand[a].k].cost);
  if (!idx.length) return null;
  const h = idx[0], c = CARDS[o.hand[h].k];
  let slot = free.find(s => p.field[s] && BEATS[c.type] === p.field[s].type);
  if (slot === undefined) slot = free.find(s => p.field[s] && BEATS[p.field[s].type] !== c.type && p.field[s].atk < c.hp);
  if (slot === undefined) slot = free.find(s => !p.field[s]);
  if (slot === undefined) slot = free[0];
  return { h, slot };
}

/** Melhor ataque disponível segundo uma heurística de valor. */
export function aiNextAttack(o, p, aggressive) {
  let best = null;
  o.field.forEach((u, i) => {
    if (!canAttack(u)) return;
    for (const t of validTargets(o, p, i)) {
      const d = p.field[t], pv = preview(u, d), loss = pv.counter ? u.cost * 1.6 + u.atk * 0.4 : 0;
      let v;
      if (pv.shielded) v = 1.2 + d.cost * 0.3 - loss;
      else if (pv.killed) v = d.cost * 2 + d.atk + 1 + pv.pierce * 1.3 + (p.life <= pv.pierce ? 1000 : 0) - loss;
      else {
        const rest = o.field.reduce((a, w, j) => a + (j !== i && canAttack(w) ? dmg(w, d) : 0), 0);
        v = pv.x * 0.45 + (pv.x + rest >= pv.left ? d.cost + d.atk * 0.5 : 0) - loss;
      }
      if (!best || v > best.v) best = { i, t, v };
    }
  });
  if (!best || (best.v <= 0 && !aggressive)) return null;
  return best;
}
