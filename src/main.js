/*
 * Ponto de entrada (raiz de composição): cria as telas, liga os eventos entre
 * as camadas e inicia o jogo depois que a fonte de título carregar.
 */
import './styles/tailwind.css';
import './styles/app.css';

import { handleChestReached } from './app/chestFlow.js';
import { challenge, handleDuelOutcome } from './app/duelFlow.js';
import { bus } from './core/EventBus.js';
import { EVENTS } from './core/events.js';
import { createGame } from './game/createGame.js';
import { installKeyboard } from './game/keyboard.js';
import { setUiProbes } from './game/session.js';
import { deckEntries, ensureDeck } from './state/deck.js';
import { DuelController } from './ui/duel/DuelController.js';
import { DuelInput } from './ui/duel/DuelInput.js';
import { DuelView } from './ui/duel/DuelView.js';
import { isAnyOverlayOpen } from './ui/dom.js';
import { renderHud } from './ui/hud.js';
import { ArenaScreen } from './ui/screens/ArenaScreen.js';
import { CollectionScreen } from './ui/screens/CollectionScreen.js';
import { DeckScreen } from './ui/screens/DeckScreen.js';
import { ForgeScreen } from './ui/screens/ForgeScreen.js';
import { IntroScreen } from './ui/screens/IntroScreen.js';
import { StageNav } from './ui/screens/StageNav.js';
import { toast } from './ui/toast.js';
import { buildWorld } from './world/world.js';

function setupUi() {
  const duel = new DuelController({ view: new DuelView(), onFinish: handleDuelOutcome });
  new DuelInput(duel);
  // todo duelo começa direto com o baralho salvo
  const startDuel = opp => duel.start(opp, deckEntries());
  new DeckScreen();
  new ArenaScreen({ startDuel });
  new ForgeScreen();
  new CollectionScreen();
  const intro = new IntroScreen();
  new StageNav();

  setUiProbes({ isDuelActive: () => duel.isActive, isOverlayOpen: isAnyOverlayOpen });
  installKeyboard(isAnyOverlayOpen);

  bus.on(EVENTS.TOAST, toast);
  bus.on(EVENTS.HUD_REFRESH, renderHud);
  bus.on(EVENTS.INTRO_REQUEST, () => intro.show());
  bus.on(EVENTS.CHEST_REACHED, handleChestReached);
  bus.on(EVENTS.NPC_CHALLENGE, npc => challenge(npc, startDuel));
}

function boot() {
  buildWorld();
  createGame('game');
}

ensureDeck(); // jogador novo (ou save antigo) já começa com baralho montado
setupUi();
const fontsReady = document.fonts && document.fonts.load ? document.fonts.load('34px "Luckiest Guy"').catch(() => {}) : Promise.resolve();
fontsReady.then(() => {
  toast('Desenhando a ilha…');
  setTimeout(boot, 60);
});
