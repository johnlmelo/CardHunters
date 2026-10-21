/* Entrada do duelo: arrastar e soltar (mouse e toque), toques, teclado e botões. */
import { validTargets } from '../../domain/duel/rules.js';
import { $ } from '../dom.js';

const DRAG_THRESHOLD = 8;

export class DuelInput {
  /** @param {import('./DuelController.js').DuelController} controller */
  constructor(controller) {
    this.ctrl = controller;
    this.drag = null;
    this.bind();
  }

  bind() {
    $('duel').addEventListener('pointerdown', e => this.onPointerDown(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e), { passive: false });
    window.addEventListener('pointerup', e => this.onPointerUp(e));
    window.addEventListener('pointercancel', () => this.endDrag());
    $('duel').addEventListener('click', e => this.onClick(e));
    $('hand').addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const el = e.target.closest('[data-h]');
      if (el) this.ctrl.play(+el.dataset.h);
    });
    $('btnEnd').onclick = () => {
      if (!this.ctrl.myTurn()) return;
      this.endDrag();
      this.ctrl.endTurn();
    };
    $('btnQuit').onclick = () => this.ctrl.quit();
  }

  /** O que está sob o ponteiro: espaço próprio, Cativo inimigo ou o oponente. */
  targetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const own = el.closest('[data-ps]');
    if (own) return { kind: 'own', i: +own.dataset.ps };
    const en = el.closest('[data-os]');
    if (en) return { kind: 'enemy', i: +en.dataset.os };
    if (el.closest('#oHead')) return { kind: 'face' };
    return null;
  }

  targetEl(t) {
    return t.kind === 'own' ? $('ps' + t.i) : t.kind === 'enemy' ? $('os' + t.i) : $('oHead');
  }

  endDrag() {
    const drag = this.drag;
    if (!drag) return;
    drag.ghost && drag.ghost.remove();
    drag.el.classList.remove('lifted');
    document.querySelectorAll('.drop-ok,.drop-atk,.drop-hover').forEach(s => s.classList.remove('drop-ok', 'drop-atk', 'drop-hover'));
    this.drag = null;
  }

  onPointerDown(e) {
    if (e.button > 0 || !this.ctrl.myTurn()) return;
    const el = e.target.closest('[data-h],[data-f]');
    if (!el) return;
    this.drag = {
      el,
      hand: el.dataset.h !== undefined ? +el.dataset.h : null,
      field: el.dataset.f !== undefined ? +el.dataset.f : null,
      x0: e.clientX, y0: e.clientY, ghost: null, id: e.pointerId,
    };
  }

  onPointerMove(e) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_THRESHOLD) return;
      this.liftGhost(drag);
    }
    e.preventDefault();
    drag.ghost.style.transform = `translate(${e.clientX - drag.w / 2}px,${e.clientY - drag.h / 2}px) rotate(4deg) scale(1.08)`;
    document.querySelectorAll('.drop-hover').forEach(s => s.classList.remove('drop-hover'));
    const t = this.targetAt(e.clientX, e.clientY);
    if (t) {
      const el = this.targetEl(t);
      if (el.classList.contains('drop-ok') || el.classList.contains('drop-atk')) el.classList.add('drop-hover');
    }
  }

  /** Cria a cópia flutuante da carta e destaca onde ela pode cair. */
  liftGhost(drag) {
    const r = drag.el.getBoundingClientRect(), g = drag.el.cloneNode(true);
    g.classList.add('ghost');
    g.classList.remove('playable', 'lifted', 'selected', 'ready');
    g.style.width = r.width + 'px';
    g.style.height = r.height + 'px';
    drag.w = r.width; drag.h = r.height;
    document.body.appendChild(g);
    drag.ghost = g;
    drag.el.classList.add('lifted');
    const D = this.ctrl.duel, p = D.p;
    if (drag.hand !== null) p.field.forEach((u, i) => { if (!u) $('ps' + i).classList.add('drop-ok'); });
    else {
      const u = p.field[drag.field];
      if (!u.moved) p.field.forEach((x, i) => { if (i !== drag.field && !(x && x.moved)) $('ps' + i).classList.add('drop-ok'); });
      validTargets(p, D.o, drag.field).forEach(t => (t === 'face' ? $('oHead') : $('os' + t)).classList.add('drop-atk'));
    }
  }

  onPointerUp(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.ghost) { // foi um toque, não um arrasto
      this.endDrag();
      if (d.hand !== null) this.ctrl.play(d.hand); else this.ctrl.toggleSelect(d.field);
      return;
    }
    const t = this.targetAt(e.clientX, e.clientY);
    this.endDrag();
    if (!t) return;
    if (d.hand !== null) { if (t.kind === 'own') this.ctrl.play(d.hand, t.i); return; }
    if (t.kind === 'own') this.ctrl.moveUnit(d.field, t.i);
    else this.ctrl.attack(d.field, t.kind === 'face' ? 'face' : t.i);
  }

  /** Com um Cativo selecionado, tocar no alvo ataca. */
  onClick(e) {
    const D = this.ctrl.duel;
    if (!this.ctrl.myTurn() || D.sel === null) return;
    const en = e.target.closest('[data-os]'), face = e.target.closest('#oHead');
    if (en && D.o.field[+en.dataset.os]) this.ctrl.attack(D.sel, +en.dataset.os);
    else if (face) this.ctrl.attack(D.sel, 'face');
  }
}
