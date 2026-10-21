/* Criação do jogo Phaser e vigia do laço de quadros. */
import Phaser from 'phaser';
import { StageScene } from './StageScene.js';
import { installTapInput } from './tapInput.js';
import { WorldMapScene } from './WorldMapScene.js';

export function createGame(parent) {
  const game = window.GAME = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1d5f8a',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    render: { pixelArt: false, antialias: true },
    // entrada lida direto do navegador (ver keyboard.js e tapInput.js)
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    // a primeira cena (mapa de fases) é a que abre
    scene: [WorldMapScene, StageScene],
  });
  game.events.once('ready', () => installTapInput(game));
  watchLoop(game);
  return game;
}

/** Se o jogo parar de desenhar quadros, religa o laço. */
function watchLoop(game) {
  let last = -1;
  setInterval(() => {
    if (document.hidden || !game.loop) return;
    const f = game.loop.frame;
    if (f === last) { try { game.loop.sleep(); game.loop.wake(); } catch (e) { console.error(e); } }
    last = f;
  }, 2000);
}
