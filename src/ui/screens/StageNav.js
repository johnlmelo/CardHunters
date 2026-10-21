/* Navegação entre o mapa de fases e as fases: botão "Mapa" no HUD e dica do rodapé. */
import { bus } from '../../core/EventBus.js';
import { EVENTS } from '../../core/events.js';
import { canOpenMenu, getActiveScene } from '../../game/session.js';
import { $ } from '../dom.js';

const HINTS = {
  map: 'Escolha uma fase: toque num círculo (de novo para entrar) · setas e Enter também funcionam',
  stage: 'Toque no mapa para andar · setas/WASD também funcionam · Espaço abre baús (ou toque no baú) · Mapa volta à escolha de fases',
};

export class StageNav {
  constructor() {
    $('btnMap').onclick = () => {
      const scene = getActiveScene();
      if (canOpenMenu() && scene.exitToMap) scene.exitToMap();
    };
    bus.on(EVENTS.SCENE_CHANGED, ({ kind }) => {
      $('btnMap').hidden = kind !== 'stage';
      $('hint').textContent = HINTS[kind];
    });
  }
}
