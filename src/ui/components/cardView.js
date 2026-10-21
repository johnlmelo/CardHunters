/* HTML de uma carta de Cativo. */
import { CARDS } from '../../data/cards.js';
import { ABILITIES, ITEMS } from '../../data/items.js';
import { TYPES } from '../../data/types.js';
import { rarity } from '../../domain/cards.js';
import { statsOf } from '../../domain/equipment.js';
import { itemArt } from '../../art/itemIcons.js';
import { monsterArt } from '../../art/monsters.js';

/**
 * @param {string} key chave do Cativo
 * @param {object} o opções: items, atk, hp (valores atuais), cls, attrs, sh (escudo), rar (mostrar raridade), count
 */
export function cardHTML(key, o = {}) {
  const c = CARDS[key], items = o.items || [], st = statsOf({ k: key, items });
  const atk = o.atk ?? st.atk, hp = o.hp ?? st.def;
  const abl = Object.keys(st.ab).map(a => ABILITIES[a].n).join(', ');
  const eqs = items.length ? `<div class="eqs">${items.map(ik => `<img src="${itemArt(ik)}" alt="">`).join('')}</div><div class="lvl">${'★'.repeat(items.length)}</div>` : '';
  const title = `${c.name} · ${TYPES[c.type]}${items.length ? ` · Nível ${st.lvl}: ${items.map(ik => ITEMS[ik].name).join(', ')}` : ''}${abl ? ` · ${abl}` : ''}`;
  return `<div class="card t-${c.type} ${o.cls || ''}${o.sh ? ' shielded' : ''}${items.length ? ' evolved' : ''}" ${o.attrs || ''} title="${title}">
    <div class="cost">${c.cost}</div>${o.rar ? `<div class="rar">${rarity(c)}</div>` : ''}
    <div class="art"><div class="mon" style="background-image:url(${monsterArt(key)});animation-delay:-${(key.charCodeAt(1) % 7) / 7}s"></div>${eqs}</div><div class="nm">${c.name}${o.count > 1 ? ` ×${o.count}` : ''}</div>
    <div class="st"><span class="a${atk > c.atk ? ' up' : ''}" title="Ataque">⚔&#xFE0E;${atk}</span><span class="h${hp > c.hp ? ' up' : ''}" title="Defesa">◈${hp}</span></div></div>`;
}
