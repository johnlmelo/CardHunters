/* Baú alcançado: sorteia o conteúdo, guarda na coleção e mostra a revelação. */
import { REGION_NAMES } from '../data/world.js';
import { chestRewards } from '../domain/rewards.js';
import { addToCollection } from '../state/collection.js';
import { saveState, state } from '../state/gameState.js';
import { showReveal } from '../ui/screens/revealDialog.js';
import { toast } from '../ui/toast.js';
import { chestTotal } from '../world/world.js';

export function handleChestReached(c) {
  const { keys, items } = chestRewards(c);
  addToCollection(keys, items);
  saveState();
  const place = c.place || REGION_NAMES[c.reg];
  showReveal(
    c.special ? 'Tesouro escondido!' : 'Baú aberto!',
    `${keys.length} Cativos de ${place} entraram na sua coleção.${items.length ? ' Tinha um equipamento no fundo do baú! Use na Forja.' : ''}`,
    keys,
    () => { if (state.opened.length >= chestTotal()) toast('Todos os baús foram abertos!'); },
    items,
  );
}
