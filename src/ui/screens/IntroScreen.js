/* Tela de introdução (regras), mostrada na primeira visita. */
import { getActiveScene } from '../../game/session.js';
import { saveState, state } from '../../state/gameState.js';
import { $ } from '../dom.js';

export class IntroScreen {
  constructor() {
    $('btnStart').onclick = () => this.start();
  }

  show() {
    $('intro').hidden = false;
  }

  start() {
    $('intro').hidden = true;
    state.intro = true;
    saveState();
    const scene = getActiveScene();
    if (scene) { scene.locked = false; scene.onTile?.(); }
  }
}
