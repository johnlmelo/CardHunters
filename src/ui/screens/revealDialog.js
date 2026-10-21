/* Janela de revelação de cartas e equipamentos ganhos (baús e vitórias). */
import { lockWorld } from '../../game/session.js';
import { cardHTML } from '../components/cardView.js';
import { itemCardHTML, itemDescription } from '../components/itemView.js';
import { $ } from '../dom.js';
import { renderHud } from '../hud.js';

export function showReveal(title, text, keys, then, items = []) {
  $('rvItems').innerHTML = items.map(itemDescription).join('');
  lockWorld(true);
  $('rvTitle').textContent = title;
  $('rvText').textContent = text;
  const cards = [...keys.map(k => cardHTML(k, { rar: 1 })), ...items.map(ik => itemCardHTML(ik))];
  $('rvCards').innerHTML = cards.map(html => `<div>${html}</div>`).join('');
  [...$('rvCards').children].forEach((d, i) => (d.firstElementChild.style.animationDelay = `${i * 0.18}s`));
  $('reveal').hidden = false;
  $('rvOk').onclick = () => {
    $('reveal').hidden = true;
    lockWorld(false);
    renderHud();
    then && then();
  };
}
