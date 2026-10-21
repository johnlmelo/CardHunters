/* Consultas e alterações da coleção do jogador (cartas e equipamentos). */
import { CARDS } from '../data/cards.js';
import { slotsOf, statsOf } from '../domain/equipment.js';
import { state } from './gameState.js';

/** Índices (em state.items) dos equipamentos do Cativo `ci`. */
export const eqOf = ci => state.eq[ci] || [];
/** Chaves dos equipamentos do Cativo `ci`. */
export const itemsOf = ci => eqOf(ci).map(ii => state.items[ii]);
/** Entrada de deck do Cativo `ci`. */
export const entryOf = ci => ({ k: state.col[ci], items: itemsOf(ci) });

/** Índice do Cativo que usa o equipamento `ii`, ou null. */
export function ownerOf(ii) {
  for (const ci in state.eq) if (state.eq[ci].includes(ii)) return +ci;
  return null;
}

/** Força estimada de um Cativo da coleção (para a escolha automática do deck). */
export const cardPower = ci => {
  const st = statsOf(entryOf(ci));
  return st.atk + st.def + CARDS[state.col[ci]].cost * 0.5 + Object.keys(st.ab).length;
};

export const equippedCount = () => Object.values(state.eq).reduce((a, l) => a + l.length, 0);

export function addToCollection(keys, items = []) {
  state.col.push(...keys);
  state.items.push(...items);
}

export function unequip(ci, ii) {
  state.eq[ci] = eqOf(ci).filter(x => x !== ii);
}

/** Equipa `ii` em `ci`, tirando de quem o usava. Devolve true se coube. */
export function equip(ci, ii) {
  const o = ownerOf(ii);
  if (o !== null) unequip(o, ii);
  if (eqOf(ci).length >= slotsOf(state.col[ci])) return false;
  state.eq[ci] = [...eqOf(ci), ii];
  return true;
}

/** Índices da coleção ordenados por tipo e custo. */
export function sortedCollection(costDesc = false) {
  return state.col.map((k, i) => i).sort((a, b) => {
    const A = CARDS[state.col[a]], B = CARDS[state.col[b]];
    return A.type.localeCompare(B.type) || (costDesc ? B.cost - A.cost : A.cost - B.cost);
  });
}
