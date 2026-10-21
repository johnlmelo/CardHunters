/* Coleção: todos os Cativos descobertos e a opção de recomeçar a aventura. */
import { CARDS } from '../../data/cards.js';
import { canOpenMenu, lockWorld } from '../../game/session.js';
import { resetState, state } from '../../state/gameState.js';
import { cardHTML } from '../components/cardView.js';
import { $ } from '../dom.js';

export class CollectionScreen {
  constructor() {
    $('btnCol').onclick = () => this.open();
    $('colClose').onclick = () => this.close();
    $('colReset').onclick = () => this.reset();
  }

  open() {
    if (!canOpenMenu()) return;
    lockWorld(true);
    const count = {};
    state.col.forEach(k => (count[k] = (count[k] || 0) + 1));
    const keys = Object.keys(CARDS).filter(k => count[k]);
    $('colInfo').textContent = `${state.col.length} cartas · ${keys.length} de ${Object.keys(CARDS).length} Cativos descobertos · ${state.wins} vitórias, ${state.losses} derrotas. Antes de cada duelo você escolhe 9 delas.`;
    $('colGrid').innerHTML = keys.map(k => cardHTML(k, { rar: 1, count: count[k] })).join('');
    $('colResetMsg').hidden = true;
    $('collection').hidden = false;
  }

  close() {
    $('collection').hidden = true;
    lockWorld(false);
  }

  /** Primeiro toque pede confirmação; o segundo apaga o progresso. */
  reset() {
    if ($('colResetMsg').hidden) { $('colResetMsg').hidden = false; return; }
    resetState();
    location.reload();
  }
}
