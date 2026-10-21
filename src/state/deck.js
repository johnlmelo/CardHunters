/*
 * Baralho do jogador: 9 cartas da coleção (índices em state.col), salvas e usadas em todos
 * os duelos. Muda só quando o jogador edita na tela Baralho.
 */
import { DECK_SIZE } from '../config/constants.js';
import { cardPower, entryOf } from './collection.js';
import { saveState, state } from './gameState.js';

/** Tamanho do baralho (menor só se a coleção ainda não tiver 9 cartas). */
export const deckSize = () => Math.min(DECK_SIZE, state.col.length);

/** Índices válidos e sem repetição do baralho salvo. */
export const deckIndices = () => [...new Set((state.deckIdx || []).filter(i => Number.isInteger(i) && i >= 0 && i < state.col.length))];

export const isInDeck = ci => deckIndices().includes(ci);
export const isDeckComplete = () => deckIndices().length === deckSize();

/** As cartas mais fortes da coleção, para montar ou completar o baralho. */
export function strongestIndices(n, exclude = []) {
  return state.col.map((k, i) => i).filter(i => !exclude.includes(i)).sort((a, b) => cardPower(b) - cardPower(a)).slice(0, n);
}

export function setDeck(indices) {
  state.deckIdx = indices.slice(0, deckSize());
  saveState();
}

/** Coloca ou tira uma carta do baralho. Devolve false se o baralho já está cheio. */
export function toggleInDeck(ci) {
  const deck = deckIndices();
  if (deck.includes(ci)) { setDeck(deck.filter(i => i !== ci)); return true; }
  if (deck.length >= deckSize()) return false;
  setDeck([...deck, ci]);
  return true;
}

/** Garante um baralho completo: completa com as cartas mais fortes que faltarem. */
export function ensureDeck() {
  const deck = deckIndices();
  if (deck.length < deckSize()) setDeck([...deck, ...strongestIndices(deckSize() - deck.length, deck)]);
  else if ((state.deckIdx || []).length !== deck.length) setDeck(deck);
}

/** Entradas (carta + equipamentos atuais) do baralho, prontas para o duelo. */
export function deckEntries() {
  ensureDeck();
  return deckIndices().map(entryOf);
}
