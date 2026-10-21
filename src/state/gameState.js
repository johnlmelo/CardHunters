/* Estado persistente do jogador: coleção, equipamentos, progresso no mapa e placar. */
import { MAP_VERSION, STORAGE_KEY } from '../config/constants.js';
import { STARTER_COLLECTION } from '../data/cards.js';
import { STARTER_ITEMS } from '../data/items.js';
import { localStorageAdapter } from './storage.js';

const storage = localStorageAdapter;

export const freshState = () => ({
  mapv: MAP_VERSION, found: [], where: null,
  col: STARTER_COLLECTION.slice(), items: STARTER_ITEMS.slice(),
  eq: {}, deckIdx: [], opened: [], wins: 0, losses: 0, beaten: {}, intro: false,
  phase: 'porto', // fase onde o herói está no mapa de fases
});

function loadState() {
  const saved = storage.load(STORAGE_KEY);
  const s = saved ? Object.assign(freshState(), saved) : freshState();
  // mapa novo: os baús antigos não existem mais, então recomeçam fechados
  if (s.mapv !== MAP_VERSION) { s.opened = []; s.where = null; s.found = []; s.mapv = MAP_VERSION; }
  STARTER_COLLECTION.slice(8).forEach(k => { if (s.col.length < 10) s.col.push(k); });
  return s;
}

/** Estado único do jogo (carregado uma vez). */
export const state = loadState();

export function saveState() {
  storage.save(STORAGE_KEY, state);
}

/** Apaga o progresso, já marcando a introdução como vista. */
export function resetState() {
  storage.save(STORAGE_KEY, { ...freshState(), intro: true });
}
