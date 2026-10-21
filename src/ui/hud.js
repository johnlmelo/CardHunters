/* Placar do topo: cartas, baús, segredos e vitórias. */
import { state } from '../state/gameState.js';
import { chestTotal, isWorldBuilt, secretTotal } from '../world/world.js';
import { $ } from './dom.js';

export function renderHud() {
  const built = isWorldBuilt();
  $('hudCards').textContent = `Cartas ${state.col.length}`;
  $('hudChests').textContent = `Baús ${state.opened.length}/${built ? chestTotal() : 0}`;
  $('hudSecrets').textContent = `Segredos ${state.found.length}/${built ? secretTotal() : 0}`;
  $('hudWins').textContent = `Vitórias ${state.wins}`;
}
