/* HTML de equipamentos, desenhados como cartas. */
import { ABILITIES, ITEMS } from '../../data/items.js';
import { TYPES } from '../../data/types.js';
import { itemArt } from '../../art/itemIcons.js';

/** Bônus do equipamento em texto. `html` destaca o nome do poder em negrito. */
export function bonusText(it, html = true) {
  const p = [];
  if (it.atk) p.push(`+${it.atk} ATQ`);
  if (it.def) p.push(`+${it.def} DEF`);
  if (it.ab) p.push(html ? `<b>${ABILITIES[it.ab].n}:</b> ${ABILITIES[it.ab].d}` : `${ABILITIES[it.ab].n}: ${ABILITIES[it.ab].d}`);
  return p.join(' · ');
}

/**
 * Carta de equipamento.
 * @param {string} ik chave do equipamento
 * @param {object} o opções: cls, attrs
 */
export function itemCardHTML(ik, o = {}) {
  const it = ITEMS[ik];
  const title = `${it.name} · Equipamento de ${TYPES[it.type]} · ${bonusText(it, false)}`;
  const stats = [
    it.atk ? `<span class="a" title="Ataque">⚔&#xFE0E;+${it.atk}</span>` : '',
    it.def ? `<span class="h" title="Defesa">◈+${it.def}</span>` : '',
  ].filter(Boolean);
  return `<div class="card equip t-${it.type} ${o.cls || ''}" ${o.attrs || ''} title="${title}">
    <div class="kind" title="Equipamento">⚒&#xFE0E;</div>${it.rare ? '<div class="rar">raro</div>' : ''}
    <div class="art"><img class="eqart" src="${itemArt(ik)}" alt="">${it.ab ? `<div class="abtag">${ABILITIES[it.ab].n}</div>` : ''}</div>
    <div class="nm">${it.name}</div>
    <div class="st${stats.length === 1 ? ' one' : ''}">${stats.join('') || '<span class="none">sem bônus</span>'}</div></div>`;
}

/** Descrição curta (nome + bônus) para acompanhar as cartas. */
export function itemDescription(ik) {
  const it = ITEMS[ik];
  return `<p class="text-xs leading-snug"><b>${it.name}</b> · ${bonusText(it)}</p>`;
}
