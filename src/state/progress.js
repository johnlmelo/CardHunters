/* Progresso de exploração: baús abertos, segredos e posição no mapa. */
import { state } from './gameState.js';

export const isChestOpened = id => state.opened.includes(id);
export function markChestOpened(id) { state.opened.push(id); }

export const isSecretFound = id => state.found.includes(id);
export function markSecretFound(id) { state.found.push(id); }

export function setPosition(map, x, y) { state.where = { map, x, y }; }
