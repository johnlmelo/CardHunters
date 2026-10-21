import { LIFE } from '../config/constants.js';
import { rarityDeck } from './cards.js';
import { giveItems } from './equipment.js';

/** Id do guardião que copia o deck do jogador. */
export const COPYCAT_ID = 'g_ninguem';

/** Deck de um duelista do mapa, mais forte conforme as vitórias do jogador. */
export function npcDeck(n, wins) {
  const lvl = Math.floor(wins / 3);
  return n.guardian
    ? giveItems(rarityDeck(n.type, 3 + Math.min(2, lvl), 1), 1 + Math.min(3, lvl))
    : giveItems(rarityDeck(n.type, 3 + Math.min(2, lvl), lvl >= 4 ? 1 : 0), 1 + Math.min(2, lvl));
}

/** Oponente a partir de um duelista do mapa. */
export function npcOpponent(n, wins) {
  const copy = n.id === COPYCAT_ID;
  return {
    name: (n.guardian ? '♛ ' : '') + n.name + (n.guardian ? ' · Guardião' : ''),
    deck: copy ? null : npcDeck(n, wins),
    copy,
    life: n.guardian ? LIFE.guard : LIFE.base,
    npc: n,
  };
}

/** Oponente simulado da arena. */
export function arenaOpponent(name, wins) {
  const deck = giveItems(
    rarityDeck(null, 3 + Math.min(3, Math.floor(wins / 2)), Math.min(2, Math.floor(wins / 5))),
    1 + Math.min(3, Math.floor(wins / 3)),
  );
  return { name: name + ' · Arena', deck, life: LIFE.base, arena: true };
}
