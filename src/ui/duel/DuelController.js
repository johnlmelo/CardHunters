/*
 * Fluxo do duelo: turnos, ações do jogador, vez do oponente e fim de jogo.
 * As regras ficam em domain/duel; o desenho, em DuelView.
 */
import { LIFE, MAX_ROUNDS } from '../../config/constants.js';
import { CARDS } from '../../data/cards.js';
import { aiNextAttack, aiNextPlay } from '../../domain/duel/ai.js';
import { beginTurn, canAttack, cardsLeft, draw, fieldEmpty, newSide, playCard, resolve, validTargets } from '../../domain/duel/rules.js';
import { wait } from '../dom.js';
import { describeAttack } from './duelMessages.js';

/** Turnos em que quem joga em segundo ganha +1 de energia. */
const SECOND_PLAYER_BONUS_TURNS = 4;
/** A partir desta rodada o oponente ataca mesmo sem vantagem. */
const AI_AGGRESSIVE_ROUND = 12;
const FINISH_DELAY_MS = 900;

export class DuelController {
  /**
   * @param {{ view: import('./DuelView.js').DuelView, onFinish: (r: { win: boolean, reason: string, opp: object }) => void }} deps
   */
  constructor({ view, onFinish }) {
    this.view = view;
    this.onFinish = onFinish;
    this.duel = null;
  }

  get isActive() { return this.duel !== null; }

  myTurn() {
    const D = this.duel;
    return !!D && D.turn === 'p' && !D.busy && !D.over;
  }

  roundNum() { return Math.max(this.duel.tc.p, this.duel.tc.o); }

  log(text) { this.view.log(text); }

  render() {
    if (this.duel) this.view.render(this.duel, this.myTurn(), this.roundNum());
  }

  start(opp, entries) {
    const pFirst = Math.random() < 0.5;
    this.duel = {
      opp,
      p: newSide(entries, LIFE.base),
      o: newSide(opp.copy ? entries : opp.deck, opp.life),
      turn: pFirst ? 'p' : 'o', busy: !pFirst, over: false, sel: null,
      tc: { p: 0, o: 0 }, second: pFirst ? 'o' : 'p',
    };
    const D = this.duel;
    // quem joga em segundo compensa com 1 carta a mais e +1 de energia nos primeiros turnos
    draw(D.p, pFirst ? 3 : 4);
    draw(D.o, pFirst ? 4 : 3);
    this.view.show(opp);
    if (pFirst) {
      this.startTurnFor('p');
      this.log('Cara ou coroa: você começa! Arraste uma carta da mão para um espaço do campo.');
      this.render();
    } else {
      this.log('Cara ou coroa: o oponente começa. Você recebe 1 carta extra e +1 de energia nos 4 primeiros turnos.');
      this.render();
      setTimeout(() => this.opponentTurn(), 1400);
    }
  }

  startTurnFor(who) {
    const D = this.duel, s = D[who], first = D.tc.p + D.tc.o === 0;
    beginTurn(s, first);
    D.tc[who]++;
    if (who === D.second && D.tc[who] <= SECOND_PLAYER_BONUS_TURNS) s.e += 1;
  }

  /* ---------- ações do jogador ---------- */

  play(i, target) {
    if (!this.myTurn()) return;
    const D = this.duel, p = D.p, c = CARDS[p.hand[i].k];
    if (c.cost > p.e) { this.log(`Energia insuficiente para ${c.name}.`); return; }
    if (target !== undefined && p.field[target]) { this.log('Esse espaço já está ocupado.'); return; }
    const slot = target !== undefined ? target : p.field.indexOf(null);
    if (slot < 0) { this.log('Seu campo está cheio.'); return; }
    const nu = playCard(p, i, slot);
    D.sel = null;
    this.log(nu.sick ? `${c.name} entrou em campo. No primeiro turno do duelo ninguém ataca.` : `${c.name} entrou em campo e já pode atacar! Toque nele e escolha o alvo.`);
    this.render();
  }

  toggleSelect(i) {
    const D = this.duel, u = D.p.field[i];
    if (!u) return;
    if (!canAttack(u)) {
      this.log(u.sick ? 'No primeiro turno do duelo ninguém ataca. Seus Cativos atacam a partir do próximo turno.' : `${u.name} já atacou neste turno.`);
      return;
    }
    D.sel = D.sel === i ? null : i;
    if (D.sel !== null) {
      const v = validTargets(D.p, D.o, i);
      this.log(v.length ? `Escolha o alvo de ${u.name}${v.includes('face') ? ', ou toque no oponente para atacar direto' : ''}.` : 'Nenhum alvo disponível.');
    } else this.log('Ataque cancelado.');
    this.render();
  }

  moveUnit(from, to) {
    const D = this.duel, f = D.p.field;
    if (from === to || !f[from]) return;
    if (f[from].moved) { this.log(`${f[from].name} já se moveu neste turno.`); return; }
    const a = f[from], b = f[to];
    if (b && b.moved) { this.log(`${b.name} já se moveu neste turno.`); return; }
    f[to] = a; f[from] = b;
    a.moved = true;
    if (b) b.moved = true;
    D.sel = null;
    this.log(b ? `${a.name} trocou de lugar com ${b.name}.` : `${a.name} mudou de posição.`);
    this.render();
  }

  async attack(i, t) {
    if (!this.myTurn()) return;
    const D = this.duel;
    const v = validTargets(D.p, D.o, i);
    if (!v.includes(t)) {
      this.log(t === 'face' ? 'Não existe ataque direto. Escolha um Cativo do oponente como alvo.' : 'Esse alvo não pode ser atacado agora.');
      return;
    }
    D.busy = true; D.sel = null;
    this.render();
    await this.view.animateAttack('p', i, 'o', t);
    if (this.duel !== D || D.over) return;
    this.log(describeAttack(resolve(D.p, D.o, i, t), 'p'));
    D.busy = false;
    this.render();
    this.checkEnd();
  }

  endTurn() {
    if (!this.myTurn()) return;
    const D = this.duel;
    D.sel = null;
    if (D.tc.p >= 2 && fieldEmpty(D.p)) {
      if (!D.warnEmpty && D.p.hand.some(e => CARDS[e.k].cost <= D.p.e)) {
        D.warnEmpty = true;
        this.log('Atenção: se passar o turno sem Cativos em campo, você perde. Coloque uma carta ou toque em Passar turno de novo.');
        return;
      }
      this.finish(false, 'Você terminou o turno sem Cativos em campo.');
      return;
    }
    D.warnEmpty = false;
    this.opponentTurn();
  }

  quit() {
    if (this.duel && !this.duel.over) this.finish(false, 'Você desistiu do duelo.');
  }

  /* ---------- vez do oponente ---------- */

  async opponentTurn() {
    // cada jogada do oponente pertence a um duelo; se o duelo acabar ou mudar, ela para
    const D = this.duel;
    const gone = () => this.duel !== D || !D || D.over;
    if (gone()) return;
    D.busy = true; D.turn = 'o';
    this.log('Vez do oponente…');
    this.render();
    await wait(450); if (gone()) return;
    this.startTurnFor('o');
    this.render();
    if (gone() || this.checkEnd()) return;
    await wait(300); if (gone()) return;

    let pl;
    while ((pl = aiNextPlay(D.o, D.p))) {
      const u = playCard(D.o, pl.h, pl.slot);
      this.log(`Oponente invocou ${u.name}.`);
      this.render();
      await wait(550); if (gone()) return;
    }

    let at;
    while ((at = aiNextAttack(D.o, D.p, (!D.o.deck.length && !D.o.hand.length) || this.roundNum() > AI_AGGRESSIVE_ROUND))) {
      await this.view.animateAttack('o', at.i, 'p', at.t); if (gone()) return;
      this.log(describeAttack(resolve(D.o, D.p, at.i, at.t), 'o'));
      this.render();
      await wait(380); if (gone() || this.checkEnd()) return;
    }

    if (gone()) return;
    if (D.tc.o >= 2 && fieldEmpty(D.o)) { this.finish(true, 'O oponente terminou o turno sem Cativos em campo.'); return; }
    D.turn = 'p';
    this.startTurnFor('p');
    D.busy = false;
    if (gone() || this.checkEnd()) return;
    if (D.tc.p >= 2 && fieldEmpty(D.p)) this.log('Seu campo está vazio! Coloque ao menos um Cativo antes de passar o turno, ou você perde.');
    if (!D.p.hand.length && !D.p.deck.length) this.log('Sua vez. Seu deck acabou: só restam os Cativos em campo.');
    else this.log('Sua vez.');
    this.render();
  }

  /* ---------- fim ---------- */

  /** Verifica as condições de vitória/derrota. Devolve true se o duelo acabou. */
  checkEnd() {
    const D = this.duel;
    if (!D || D.over) return true;
    const { p, o } = D;
    const end = (win, reason) => { this.finish(win, reason); return true; };
    if (o.life <= 0) return end(true, 'Nocaute!');
    if (p.life <= 0) return end(false, 'Você foi nocauteado.');
    if (!cardsLeft(o)) return end(true, 'O oponente ficou sem cartas.');
    if (!cardsLeft(p)) return end(false, 'Suas 9 cartas acabaram antes do nocaute.');
    if (this.roundNum() > MAX_ROUNDS) return end(p.life > o.life, 'Limite de rodadas: vence quem tem mais vida.');
    return false;
  }

  finish(win, reason) {
    const D = this.duel;
    D.over = true; D.busy = true;
    this.log(reason);
    this.render();
    setTimeout(() => {
      this.view.hide();
      this.duel = null;
      this.onFinish({ win, reason, opp: D.opp });
    }, FINISH_DELAY_MS);
  }
}
