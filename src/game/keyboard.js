/* Teclado lido direto do navegador: setas e WASD viram direções U/D/L/R; Enter e Espaço viram A (ação). */

const KEYMAP = { ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', Enter: 'A', Space: 'A' };

/** Teclas (direções e ação) pressionadas no momento. */
export const pressedKeys = new Set();

const pressListeners = new Set();

/** Avisa a cada tecla apertada (sem repetição), mesmo que solta antes do próximo quadro. */
export function onKeyPress(fn) {
  pressListeners.add(fn);
  return () => pressListeners.delete(fn);
}

/** Liga os ouvintes. `isBlocked()` impede movimento (ex.: janela aberta). */
export function installKeyboard(isBlocked = () => false) {
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (!k || isBlocked()) return;
    pressedKeys.add(k);
    if (!e.repeat) pressListeners.forEach(fn => fn(k));
    e.preventDefault();
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) pressedKeys.delete(k); });
  window.addEventListener('blur', () => pressedKeys.clear());
}
