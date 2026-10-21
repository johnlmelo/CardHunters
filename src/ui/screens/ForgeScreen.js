/* Forja: equipar os Cativos do baralho com itens do mesmo tipo. */
import { CARDS } from '../../data/cards.js';
import { ABILITIES, ITEMS } from '../../data/items.js';
import { TYPES } from '../../data/types.js';
import { rarity } from '../../domain/cards.js';
import { RESONANCE_MIN, slotsOf, statsOf } from '../../domain/equipment.js';
import { canOpenMenu, lockWorld } from '../../game/session.js';
import { eqOf, entryOf, equip, equippedCount, itemsOf, ownerOf, sortedCollection, unequip } from '../../state/collection.js';
import { deckIndices, ensureDeck } from '../../state/deck.js';
import { saveState, state } from '../../state/gameState.js';
import { cardHTML } from '../components/cardView.js';
import { itemCardHTML } from '../components/itemView.js';
import { $ } from '../dom.js';

export class ForgeScreen {
  /** Índice (na coleção) do Cativo selecionado. */
  ci = null;

  constructor() {
    $('btnForge').onclick = () => this.open();
    $('fgClose').onclick = () => this.close();
    $('forge').addEventListener('click', e => this.onClick(e));
    $('forge').addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const el = e.target.closest('[data-fc]');
      if (el) el.click();
    });
  }

  open() {
    if (!canOpenMenu()) return;
    lockWorld(true);
    // só os Cativos do baralho aparecem: começa no selecionado, se ainda estiver no baralho
    ensureDeck();
    const deck = this.deckOrder();
    if (!deck.includes(this.ci)) this.ci = deck.find(i => eqOf(i).length) ?? deck[0];
    this.render();
    $('forge').hidden = false;
  }

  close() {
    $('forge').hidden = true;
    lockWorld(false);
  }

  onClick(e) {
    const un = e.target.closest('[data-un]'), eq = e.target.closest('[data-eq]'), fc = e.target.closest('[data-fc]');
    if (un) {
      unequip(this.ci, +un.dataset.un);
      saveState();
      this.render();
      return;
    }
    if (eq && !eq.disabled) {
      if (equip(this.ci, +eq.dataset.eq)) {
        saveState();
        this.render();
        const card = document.querySelector('.fg-card .card');
        card && card.classList.add('forged');
      }
      return;
    }
    if (fc) {
      this.ci = +fc.dataset.fc;
      this.render();
      $('fgDetail').scrollIntoView({ block: 'nearest' });
    }
  }

  render() {
    const ci = this.ci, k = state.col[ci], c = CARDS[k], st = statsOf(entryOf(ci)), slots = slotsOf(k), eq = eqOf(ci);
    $('fgDetail').innerHTML = this.detailHTML(ci, k, c, st, slots, eq);
    $('fgGrid').innerHTML = this.deckOrder()
      .map(i => `<div class="fpick${i === ci ? ' on' : ''}" data-fc="${i}" role="button" tabindex="0" aria-pressed="${i === ci}">${cardHTML(state.col[i], { items: itemsOf(i) })}</div>`)
      .join('');
    $('fgInfo').textContent = `${state.items.length} equipamentos · ${equippedCount()} em uso`;
  }

  /** Índices do baralho, ordenados por tipo e custo (maior primeiro). */
  deckOrder() {
    const deck = new Set(deckIndices());
    return sortedCollection(true).filter(i => deck.has(i));
  }

  detailHTML(ci, k, c, st, slots, eq) {
    const slotHtml = Array.from({ length: slots }, (_, s) => (eq[s] !== undefined
      ? equipCell(state.items[eq[s]], `<button class="btn btn-wood text-xs" data-un="${eq[s]}">Tirar</button>`)
      : '<div class="eqcell"><div class="slot-card">Espaço livre</div></div>')).join('');
    const abl = Object.keys(st.ab);
    const mine = state.items.map((ik, ii) => ({ ik, ii })).filter(x => ITEMS[x.ik].type === c.type && !eq.includes(x.ii));
    const full = eq.length >= slots;
    const avail = mine.length
      ? `<div class="fg-cards">${mine.map(({ ik, ii }) => {
        const o = ownerOf(ii);
        return equipCell(ik, `${o !== null ? `<span class="eqowner">em ${CARDS[state.col[o]].name}${deckIndices().includes(o) ? '' : ' (fora do baralho)'}</span>` : ''}<button class="btn btn-gold text-xs" data-eq="${ii}"${full ? ' disabled' : ''}>${o !== null ? 'Trazer' : 'Equipar'}</button>`);
      }).join('')}</div>`
      : `<p class="text-sm">Você ainda não tem equipamentos de ${TYPES[c.type]}. Eles aparecem em baús e como prêmio de duelos.</p>`;
    const others = state.items.filter(ik => ITEMS[ik].type !== c.type);
    const byType = {};
    others.forEach(ik => (byType[ITEMS[ik].type] = byType[ITEMS[ik].type] || []).push(ik));
    return `
    <div class="fg-top">
      <div class="fg-card">${cardHTML(k, { items: itemsOf(ci), rar: 1 })}</div>
      <div class="min-w-0 flex-1 flex flex-col gap-2">
        <div><div class="fg-name">${c.name}</div>
          <div class="text-xs font-bold">${TYPES[c.type]} · ${rarity(c)} · Nível ${st.lvl} · <span class="stat-a">⚔&#xFE0E;${st.atk}</span> <span class="stat-d">◈${st.def}</span>${eq.length >= RESONANCE_MIN ? ' · <b>Ressonância +1 ATQ</b>' : ''}</div></div>
        ${abl.length ? `<p class="text-xs">${abl.map(a => `<b>${ABILITIES[a].n}:</b> ${ABILITIES[a].d}`).join('<br>')}</p>` : '<p class="text-xs">Sem poderes especiais ainda.</p>'}
      </div>
    </div>
    <div class="fg-h">Espaços (${eq.length}/${slots})</div>
    <div class="fg-cards">${slotHtml}</div>
    ${full && mine.length ? '<p class="text-xs">Espaços cheios. Tire um equipamento para colocar outro.</p>' : ''}
    <div class="fg-h">Equipamentos de ${TYPES[c.type]}</div>
    ${avail}
    ${others.length ? `<div class="fg-h">Outros tipos (só servem em Cativos do mesmo tipo)</div><div class="fg-cards mini">${Object.values(byType).map(l => l.map(ik => itemCardHTML(ik, { cls: 'dim' })).join('')).join('')}</div>` : ''}`;
  }
}

/** Carta de equipamento com descrição do poder e ações embaixo. */
function equipCell(ik, actions) {
  const ab = ITEMS[ik].ab;
  return `<div class="eqcell">${itemCardHTML(ik)}${ab ? `<p class="eqdesc">${ABILITIES[ab].d}</p>` : ''}<div class="eqactions">${actions}</div></div>`;
}
