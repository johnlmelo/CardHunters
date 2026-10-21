import { REGION_TYPE } from '../data/world.js';
import { pickCard } from './cards.js';
import { pickItem } from './equipment.js';
import { COPYCAT_ID } from './opponents.js';

/** Conteúdo de um baú: 3 Cativos e, às vezes, um equipamento. */
export function chestRewards(c) {
  const t = REGION_TYPE[c.reg], boost = c.boost || (c.reg === 'templo' ? 25 : 0);
  const keys = [0, 1, 2].map(i => pickCard(Math.random() < 0.15 ? 'inveja' : (i === 2 && Math.random() < 0.3 ? null : t), Math.random, boost));
  const items = c.special ? [pickItem(t, 0.6)] : Math.random() < 0.55 ? [pickItem(t, c.reg === 'templo' ? 0.5 : 0.15)] : [];
  return { keys, items };
}

/** Prêmio de vitória. A primeira vitória sobre um guardião dá dois Cativos raros e um equipamento raro. */
export function duelRewards(opp, firstGuardianWin) {
  const n = opp.npc;
  let keys;
  if (firstGuardianWin) keys = n.id === COPYCAT_ID ? ['v3', 'v2'] : [pickCard(n.type, Math.random, 60), pickCard(n.type, Math.random, 30)];
  else keys = [n ? pickCard(Math.random() < 0.8 ? n.type : null) : pickCard(null, Math.random, 10)];
  const items = firstGuardianWin ? [pickItem(n.type, 1)] : Math.random() < 0.35 ? [pickItem(n ? n.type : null)] : [];
  return { keys, items };
}
