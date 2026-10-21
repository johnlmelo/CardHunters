/*
 * Tela Baralho: o baralho de 9 cartas fica numa coluna lateral, ao lado da coleção.
 * Tocar numa carta da coleção coloca no baralho; tocar numa do baralho tira.
 * O baralho é salvo na hora e usado em todos os duelos.
 */
import { statsOf } from '../../domain/equipment.js';
import { canOpenMenu, lockWorld } from '../../game/session.js';
import { entryOf, itemsOf, sortedCollection } from '../../state/collection.js';
import { deckIndices, deckSize, ensureDeck, isDeckComplete, setDeck, strongestIndices, toggleInDeck } from '../../state/deck.js';
import { state } from '../../state/gameState.js';
import { cardHTML } from '../components/cardView.js';
import { deckRowHTML } from '../components/deckRow.js';
import { $ } from '../dom.js';

export class DeckScreen {
  constructor() {
    $('btnDeck').onclick = () => this.open();
    $('dbClose').onclick = () => this.close();
    $('dbGrid').addEventListener('click', e => {
      const el = e.target.closest('[data-ci]');
      if (el) this.toggle(+el.dataset.ci);
    });
    $('dbDeck').addEventListener('click', e => {
      const el = e.target.closest('[data-rm]');
      if (el) this.toggle(+el.dataset.rm);
    });
    for (const id of ['dbGrid', 'dbDeck']) {
      $(id).addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const el = e.target.closest('[data-ci],[data-rm]');
        if (el) el.click();
      });
    }
    $('dbAuto').onclick = () => { setDeck(strongestIndices(deckSize())); this.render('Baralho montado com as cartas mais fortes.'); };
    $('dbClear').onclick = () => { setDeck([]); this.render('Baralho vazio: escolha 9 cartas na coleção.'); };
  }

  open() {
    if (!canOpenMenu()) return;
    lockWorld(true);
    ensureDeck();
    this.render('');
    $('deckb').hidden = false;
  }

  close() {
    if (!isDeckComplete()) { this.render(`Faltam ${deckSize() - deckIndices().length} cartas para completar o baralho.`); return; }
    $('deckb').hidden = true;
    lockWorld(false);
  }

  toggle(ci) {
    if (toggleInDeck(ci)) this.render('');
    else this.render('Baralho cheio: tire uma carta antes de colocar outra.');
  }

  render(msg) {
    const deck = deckIndices(), size = deckSize(), inDeck = new Set(deck);
    const rows = deck.map(ci => deckRowHTML(ci, state.col[ci], itemsOf(ci)));
    for (let i = deck.length; i < size; i++) rows.push('<div class="deck-empty">Espaço vazio</div>');
    $('dbDeck').innerHTML = rows.join('');
    $('dbGrid').innerHTML = sortedCollection()
      .map(i => `<div class="pick" data-ci="${i}" role="button" tabindex="0" aria-pressed="${inDeck.has(i)}">${cardHTML(state.col[i], { items: itemsOf(i), cls: inDeck.has(i) ? 'picked' : '' })}</div>`)
      .join('');
    const pow = deck.reduce((a, i) => { const st = statsOf(entryOf(i)); return a + st.atk + st.def; }, 0);
    $('dbCount').textContent = `${deck.length}/${size} · Poder ${pow}`;
    $('dbClose').disabled = deck.length !== size;
    $('dbMsg').textContent = msg || (deck.length === size ? 'Baralho completo. Ele entra direto no próximo duelo.' : `Escolha mais ${size - deck.length}.`);
  }
}
