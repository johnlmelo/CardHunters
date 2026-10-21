/*
 * Toque e clique no canvas, lidos direto do navegador (uma vez só para o jogo todo).
 * Um toque curto chama `onTap(worldX, worldY)` da cena ativa, se ela estiver livre.
 */
import { getActiveScene } from './session.js';

const MAX_TAP_MOVE = 14;

export function installTapInput(game) {
  const cv = game.canvas;
  let down = null;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  cv.addEventListener('pointerup', e => {
    const sc = getActiveScene();
    if (!down || down.id !== e.pointerId || !sc) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > MAX_TAP_MOVE || sc.locked || !sc.onTap) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (sc.scale.width / r.width), y = (e.clientY - r.top) * (sc.scale.height / r.height);
    const wp = sc.cameras.main.getWorldPoint(x, y);
    sc.onTap(wp.x, wp.y);
  });
  cv.addEventListener('pointercancel', () => { down = null; });
}
