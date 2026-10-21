/* Aviso flutuante no topo do mapa. */
import { $ } from './dom.js';

const DURATION_MS = 2200;
let timer;

export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(timer);
  timer = setTimeout(() => (t.style.opacity = 0), DURATION_MS);
}
