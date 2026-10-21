/* Progresso de cada fase (baús, segredos e guardiões, incluindo as cavernas) e desbloqueio das fases. */
import { PHASES, phaseMapId } from '../data/phases.js';
import { MAPS, cavesOf } from '../world/world.js';
import { state } from './gameState.js';
import { isChestOpened, isSecretFound } from './progress.js';

const count = (list, done) => ({ done: list.filter(done).length, total: list.length });

export function phaseProgress(phaseId) {
  const m = MAPS[phaseMapId(phaseId)], caves = cavesOf(phaseId);
  const chests = [...m.chests, ...caves.flatMap(id => MAPS[id].chests)];
  const guardians = [...m.npcs, ...caves.flatMap(id => MAPS[id].npcs)].filter(n => n.guardian);
  const secrets = [...m.secrets.map(s => s.id), ...caves];
  const p = {
    chests: count(chests, c => isChestOpened(c.id)),
    secrets: count(secrets, isSecretFound),
    guardians: count(guardians, n => !!state.beaten[n.nid]),
  };
  p.complete = [p.chests, p.secrets, p.guardians].every(x => x.done >= x.total);
  return p;
}

export const isBossBeaten = phase => !!state.beaten[phase.boss];

/** A primeira fase está sempre aberta; as outras, depois de vencer o chefe da anterior. */
export const isPhaseUnlocked = index => index === 0 || (index > 0 && index < PHASES.length && isBossBeaten(PHASES[index - 1]));

/** Índice da última fase aberta. */
export function lastUnlockedIndex() {
  let i = 0;
  while (isPhaseUnlocked(i + 1)) i++;
  return i;
}
