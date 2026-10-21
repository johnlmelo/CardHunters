/* Arena: "procura" um oponente simulado e começa o duelo com o baralho salvo. */
import { ARENA_NAMES } from '../../data/opponents.js';
import { randomOf } from '../../core/random.js';
import { arenaOpponent } from '../../domain/opponents.js';
import { canOpenMenu, lockWorld } from '../../game/session.js';
import { state } from '../../state/gameState.js';
import { $, wait } from '../dom.js';

const DEFAULT_TEXT = 'Duelistas da arena (simulados nesta versão)';

export class ArenaScreen {
  /** @param {{ startDuel: (opp: object) => void }} deps */
  constructor({ startDuel }) {
    this.startDuel = startDuel;
    $('btnArena').onclick = () => this.findOpponent();
  }

  async findOpponent() {
    if (!canOpenMenu()) return;
    lockWorld(true);
    $('match').hidden = false;
    const name = randomOf(ARENA_NAMES);
    await wait(1300);
    $('matchText').textContent = `Oponente encontrado: ${name}`;
    await wait(800);
    $('match').hidden = true;
    $('matchText').textContent = DEFAULT_TEXT;
    this.startDuel(arenaOpponent(name, state.wins));
  }
}
