/* Linha compacta de uma carta do baralho (coluna lateral da tela Baralho). */
import { CARDS } from '../../data/cards.js';
import { statsOf } from '../../domain/equipment.js';
import { monsterArt } from '../../art/monsters.js';

/** @param {number} ci índice na coleção  @param {string} key  @param {string[]} items */
export function deckRowHTML(ci, key, items) {
  const c = CARDS[key], st = statsOf({ k: key, items });
  return `<div class="deck-row t-${c.type}" data-rm="${ci}" role="button" tabindex="0" title="Tirar ${c.name} do baralho">
    <span class="dcost">${c.cost}</span>
    <span class="dart" style="background-image:url(${monsterArt(key)})"></span>
    <span class="dname">${c.name}${items.length ? ` ${'★'.repeat(items.length)}` : ''}</span>
    <span class="dstats"><span class="stat-a">⚔&#xFE0E;${st.atk}</span> <span class="stat-d">◈${st.def}</span></span>
    <span class="dx" aria-hidden="true">✕</span></div>`;
}
