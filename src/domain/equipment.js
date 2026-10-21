import { CARDS } from '../data/cards.js';
import { ITEMS, SLOTS_BY_RARITY } from '../data/items.js';
import { rarity } from './cards.js';

/** Mínimo de equipamentos para a Ressonância (+1 de ataque). */
export const RESONANCE_MIN = 2;

export const slotsOf = k => SLOTS_BY_RARITY[rarity(CARDS[k])];

/** Normaliza uma entrada de deck: chave solta vira { k, items: [] }. */
export const asEntry = e => (typeof e === 'string' ? { k: e, items: [] } : e);

/** Atributos finais de um Cativo com seus equipamentos. */
export function statsOf(e) {
  e = asEntry(e);
  const c = CARDS[e.k];
  let atk = c.atk, def = c.hp;
  const ab = {};
  for (const ik of e.items) {
    const it = ITEMS[ik];
    atk += it.atk || 0;
    def += it.def || 0;
    if (it.ab) ab[it.ab] = 1;
  }
  if (e.items.length >= RESONANCE_MIN) atk += 1; // Ressonância
  return { atk, def, ab, lvl: 1 + e.items.length };
}

/** Sorteia um equipamento (opcionalmente de um tipo). */
export function pickItem(type, rareChance = 0.2) {
  const pool = Object.keys(ITEMS).filter(k => !type || ITEMS[k].type === type);
  const rares = pool.filter(k => ITEMS[k].rare), commons = pool.filter(k => !ITEMS[k].rare);
  const src = Math.random() < rareChance && rares.length ? rares : commons;
  return src[Math.floor(Math.random() * src.length)];
}

/** Devolve uma cópia do deck com `n` equipamentos distribuídos aleatoriamente. */
export function giveItems(deck, n) {
  deck = deck.map(e => ({ ...asEntry(e), items: [...asEntry(e).items] }));
  for (let t = 0; t < n * 3 && n > 0; t++) {
    const e = deck[Math.floor(Math.random() * deck.length)];
    if (e.items.length < slotsOf(e.k)) { e.items.push(pickItem(CARDS[e.k].type, 0.25)); n--; }
  }
  return deck;
}
