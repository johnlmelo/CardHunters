import { CARDS } from '../data/cards.js';
import { DECK_SIZE } from '../config/constants.js';
import { randomOf } from '../core/random.js';

export const rarity = c => (c.cost >= 5 ? 'lendária' : c.cost >= 3 ? 'rara' : 'comum');

/** Peso de sorteio por raridade. */
const RARITY_WEIGHT = { comum: 60, rara: 30, 'lendária': 10 };

/** Sorteia um Cativo (opcionalmente de um tipo). `boost` aumenta a chance de raros e lendários. */
export function pickCard(type, rnd = Math.random, boost = 0) {
  const pool = Object.keys(CARDS).filter(k => !type || CARDS[k].type === type);
  const w = pool.map(k => { const r = rarity(CARDS[k]); return RARITY_WEIGHT[r] + (r !== 'comum' ? boost : 0); });
  let t = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { t -= w[i]; if (t <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

/** Sorteia um Cativo de uma raridade exata. */
export function ofRarity(type, rar) {
  const pool = Object.keys(CARDS).filter(k => (!type || CARDS[k].type === type) && rarity(CARDS[k]) === rar);
  return randomOf(pool);
}

/** Monta um deck com a quantidade pedida de raros e lendários (80% do tipo indicado). */
export function rarityDeck(type, rares, legends) {
  const out = [];
  const add = (n, r) => { for (let i = 0; i < n; i++) out.push(ofRarity(type && Math.random() < 0.8 ? type : null, r)); };
  add(DECK_SIZE - rares - legends, 'comum');
  add(rares, 'rara');
  add(legends, 'lendária');
  return out;
}
