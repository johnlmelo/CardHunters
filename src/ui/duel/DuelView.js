/* Desenho da tela de duelo a partir do estado (não altera o estado). */
import { CARDS } from '../../data/cards.js';
import { RANDOM_LOOKS } from '../../data/opponents.js';
import { randomOf } from '../../core/random.js';
import { LOOKS, figure } from '../../art/characters.js';
import { canAttack, cardsLeft, defLeft, preview, validTargets } from '../../domain/duel/rules.js';
import { cardHTML } from '../components/cardView.js';
import { $, wait } from '../dom.js';

/** Visual do oponente: guardião usa o próprio, duelista usa o do tipo, arena sorteia um. */
export function opponentLook(opp) {
  if (opp.npc) {
    const l = opp.npc.guardian ? opp.npc.id : opp.npc.type;
    return LOOKS[l] ? l : (LOOKS[opp.npc.type] ? opp.npc.type : 'ouro');
  }
  return opp.look || (opp.look = randomOf(RANDOM_LOOKS));
}

export class DuelView {
  show(opp) {
    // o duelo começa logo abaixo do HUD, que continua visível (os menus ficam travados)
    document.documentElement.style.setProperty('--hud-h', document.querySelector('.hud').offsetHeight + 'px');
    $('oPic').src = figure(opponentLook(opp));
    $('pPic').src = figure('hero');
    $('oName').textContent = opp.name;
    $('duel').hidden = false;
  }

  hide() { $('duel').hidden = true; }

  log(text) { $('log').textContent = text; }

  /** Elemento de um espaço do campo: side 'p' | 'o'. */
  slot(side, i) { return $(side + 's' + i); }

  /** Elemento do cabeçalho (alvo de "ataque direto"). */
  head(side) { return $(side + 'Head'); }

  async animateAttack(side, i, targetSide, t) {
    const slot = this.slot(side, i), a = slot && slot.firstElementChild;
    a && a.classList.add('atk');
    await wait(300);
    const d = t === 'face' ? this.head(targetSide) : this.slot(targetSide, t);
    const de = d && (d.classList.contains('slot') ? d.firstElementChild : d);
    de && de.classList.add('hit');
    await wait(330);
  }

  render(D, my, round) {
    const { p, o } = D;
    $('oLife').textContent = `${Math.max(0, o.life)}/${o.maxLife}`;
    $('pLife').textContent = `${Math.max(0, p.life)}/${p.maxLife}`;
    $('oLifeBar').style.width = Math.max(0, o.life / o.maxLife * 100) + '%';
    $('pLifeBar').style.width = Math.max(0, p.life / p.maxLife * 100) + '%';
    $('oInfo').textContent = `Mão ${o.hand.length} · Restam ${cardsLeft(o)}`;
    $('pDeck').textContent = `Deck ${p.deck.length} · Restam ${cardsLeft(p)}`;
    $('round').textContent = `Rodada ${Math.max(1, round)}`;

    const tg = D.sel !== null && my ? validTargets(p, o, D.sel) : [];
    const weak = D.sel !== null && my ? o.field.map(d => d && !preview(p.field[D.sel], d).killed) : [];

    $('pField').innerHTML = p.field.map((u, i) => {
      let inner = '';
      if (u) {
        const ready = my && canAttack(u), drag = my && (ready || !u.moved);
        inner = cardHTML(u.k, {
          atk: u.atk, hp: defLeft(u), items: u.items, sh: u.shield,
          cls: [u.sick ? 'sick' : '', ready ? 'ready' : '', u.done ? 'spent' : '', D.sel === i ? 'selected' : ''].join(' '),
          attrs: drag ? `data-f="${i}"` : '',
        });
      }
      return `<div class="slot" id="ps${i}" data-ps="${i}">${inner}</div>`;
    }).join('');

    $('oField').innerHTML = o.field.map((u, i) => `<div class="slot" id="os${i}" data-os="${i}">${u ? cardHTML(u.k, {
      atk: u.atk, hp: defLeft(u), items: u.items, sh: u.shield,
      cls: (u.sick ? 'sick ' : '') + (tg.includes(i) ? (weak[i] ? 'target blocked' : 'target') : ''),
    }) : ''}</div>`).join('');

    $('oHead').classList.toggle('target', tg.includes('face'));
    $('pips').innerHTML = Array.from({ length: Math.max(p.maxE, p.e) }, (_, i) => `<span class="pip ${i < p.e ? 'on' : ''}"></span>`).join('');

    const free = p.field.includes(null);
    $('hand').innerHTML = p.hand.map((e, i) => {
      const ok = my && free && CARDS[e.k].cost <= p.e;
      return `<div>${cardHTML(e.k, { items: e.items, cls: ok ? 'playable' : 'dim', attrs: `data-h="${i}" role="button" tabindex="0"` })}</div>`;
    }).join('') || '<p class="empty">Mão vazia.</p>';
    $('btnEnd').disabled = !my;
  }
}
