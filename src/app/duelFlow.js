/* Início (desafio de um duelista) e desfecho de duelos: placar, prêmios e avisos. */
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { npcOpponent } from '../domain/opponents.js';
import { duelRewards } from '../domain/rewards.js';
import { lockWorld } from '../game/session.js';
import { addToCollection } from '../state/collection.js';
import { saveState, state } from '../state/gameState.js';
import { showReveal } from '../ui/screens/revealDialog.js';
import { toast } from '../ui/toast.js';

/** Um duelista do mapa desafiou o herói: o duelo começa direto com o baralho salvo. */
export function challenge(npc, startDuel) {
  lockWorld(true);
  startDuel(npcOpponent(npc, state.wins));
}

export function handleDuelOutcome({ win, reason, opp }) {
  if (!win) {
    state.losses++;
    saveState();
    lockWorld(false);
    toast(reason);
    return;
  }
  state.wins++;
  const n = opp.npc;
  const firstGuardianWin = !!(n && n.guardian && !state.beaten[n.id]);
  if (firstGuardianWin) state.beaten[n.id] = 1;
  const { keys, items } = duelRewards(opp, firstGuardianWin);
  const text = firstGuardianWin
    ? `${reason} Você venceu ${n.name} pela primeira vez e ganhou dois Cativos raros.`
    : `${reason} ${opp.arena ? 'A arena recompensa você com uma carta.' : 'O duelista entrega uma carta como prêmio.'}`;
  addToCollection(keys, items);
  saveState();
  // ao fechar o prêmio, a cena reage (ex.: chefe vencido abre o portal da fase)
  const afterReveal = n ? () => bus.emit(EVENTS.DUELIST_DEFEATED, { id: n.id }) : null;
  showReveal('Vitória!', text + (items.length ? ' Você também ganhou um equipamento para a Forja!' : ''), keys, afterReveal, items);
}
