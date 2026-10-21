/*
 * Mapa de fases (estilo mapa-múndi do Mario): a ilha em miniatura, um nó por fase ligado
 * por um caminho pontilhado. O herói anda de nó em nó e entra na fase escolhida.
 * As fases são progressivas: a próxima só abre depois de vencer o chefe da anterior.
 */
import Phaser from 'phaser';
import { TILE as T } from '../config/constants.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { PHASES, phaseMapId } from '../data/phases.js';
import { TYPE_COLORS } from '../data/types.js';
import { GUARDIAN_NAMES, REGION_NAMES, REGION_TYPE } from '../data/world.js';
import { artCanvas, waterTileCanvas } from '../art/canvas.js';
import { paintMap, paintMapAsync, releasePaint } from '../art/groundPainter.js';
import { propArt } from '../art/props.js';
import { saveState, state } from '../state/gameState.js';
import { isPhaseUnlocked, lastUnlockedIndex, phaseProgress } from '../state/phaseProgress.js';
import { BLOCK_BIO } from '../world/tiles.js';
import { MAPS, buildWorld } from '../world/world.js';
import { face } from './characterAnimator.js';
import { onKeyPress } from './keyboard.js';
import { releaseStuckLock, setActiveScene } from './session.js';
import { artTex, makeLook } from './textures.js';

const STEP_MS = 380;          // tempo de um nó ao vizinho
const DOT_GAP = 26;           // distância entre pontos do caminho (px na tela)
const NODE_RADIUS = 22;       // raio do nó (px na tela)
const FRAME_PAD = 2;          // margem (tiles) em volta da ilha
const LOCKED_FILL = 0x4a4f5a;  // nó trancado

export class WorldMapScene extends Phaser.Scene {
  constructor() { super('mapa'); }

  /** @param {{ cleared?: string }} data `cleared`: fase cujo portal o herói acabou de atravessar */
  create(data) {
    setActiveScene(this);
    buildWorld();
    this.locked = true; this.moving = false; this.path = []; this.idleLock = 0;
    this.island = MAPS.ilha;
    const saved = Math.max(0, PHASES.findIndex(p => p.id === state.phase));
    this.current = Math.min(saved, lastUnlockedIndex());
    // ao voltar pelo portal, a fase seguinte aparece trancada e abre com animação
    const cleared = data && data.cleared ? PHASES.findIndex(p => p.id === data.cleared) : -1;
    this.revealIndex = cleared >= 0 && isPhaseUnlocked(cleared + 1) ? cleared + 1 : null;
    if (cleared >= 0) this.current = cleared;

    this.createBackdrop();
    this.nodes = PHASES.map(phase => this.createNode(phase));
    this.pathGfx = this.add.graphics().setDepth(9000);
    this.createHero();

    this.layout();
    this.scale.on('resize', this.layout, this);
    const offKeys = onKeyPress(k => this.onKey(k));
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); offKeys(); });
    this.prepaint(this.current);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    bus.emit(EVENTS.SCENE_CHANGED, { kind: 'map' });
    const finished = cleared === PHASES.length - 1;
    bus.emit(EVENTS.TOAST, finished ? 'Você libertou a Ilha da Cobiça!' : 'Ilha da Cobiça');
    bus.emit(EVENTS.HUD_REFRESH);
    if (!state.intro) bus.emit(EVENTS.INTRO_REQUEST);
    else if (this.revealIndex !== null) this.time.delayedCall(600, () => this.playUnlock(this.revealIndex));
    else this.time.delayedCall(300, () => { this.locked = false; });
  }

  /* ---------- construção ---------- */

  createBackdrop() {
    const m = this.island;
    artTex(this, 'waterTile', waterTileCanvas);
    this.add.tileSprite(-1600, -1600, m.W * T + 3200, m.H * T + 3200, 'waterTile').setOrigin(0).setDepth(-20);
    // a miniatura é pintada aqui mesmo (na abertura, coberta pelo aviso "Desenhando a ilha…")
    if (!this.textures.exists('ground_' + m.id)) this.textures.addCanvas('ground_' + m.id, paintMap(m));
    this.add.image(0, 0, 'ground_' + m.id).setOrigin(0).setDepth(-10);
    for (const p of m.props) {
      const key = artTex(this, 'prop_' + p.k, () => artCanvas(propArt(p.k)));
      this.add.image(p.px, p.py, key).setOrigin(0.5, 1).setDepth(p.flat ? -5 : p.py);
    }
    // véu escuro para dar cara de mapa e destacar os nós
    this.add.rectangle(-1600, -1600, m.W * T + 3200, m.H * T + 3200, 0x08101a, 0.35).setOrigin(0).setDepth(8000);
    this.frame = landFrame(m);
  }

  createNode(phase) {
    const pos = regionCenter(this.island, phase.reg);
    const color = TYPE_COLORS[REGION_TYPE[phase.reg]];
    const c = this.add.container(pos.x, pos.y).setDepth(9100);
    const ring = this.add.circle(0, 0, NODE_RADIUS + 7, 0xffffff, 0).setStrokeStyle(3, 0xffd95e).setAlpha(0);
    const disc = this.add.circle(0, 0, NODE_RADIUS, color).setStrokeStyle(4, 0x3a2408);
    const num = this.add.text(0, 1, String(phase.number), { fontFamily: 'Luckiest Guy', fontSize: '22px', color: '#ffffff', stroke: '#3a2408', strokeThickness: 5 }).setOrigin(0.5);
    const lock = this.add.graphics();
    lock.fillStyle(0x3a2408, 1).fillRoundedRect(-9, -3, 18, 14, 3);
    lock.lineStyle(4, 0x3a2408, 1).beginPath().arc(0, -3, 6, Math.PI, 0).strokePath();
    lock.lineStyle(2, 0xf6e7c4, 1).beginPath().arc(0, -3, 6, Math.PI, 0).strokePath();
    lock.fillStyle(0xf6e7c4, 1).fillRoundedRect(-7, -1, 14, 10, 2);
    lock.fillStyle(0x3a2408, 1).fillRect(-1, 2, 2, 4);
    const star = this.add.text(NODE_RADIUS - 2, -NODE_RADIUS + 2, '★', { fontFamily: 'Nunito', fontStyle: '900', fontSize: '18px', color: '#ffd95e', stroke: '#3a2408', strokeThickness: 4 }).setOrigin(0.5);
    const name = this.add.text(0, NODE_RADIUS + 8, REGION_NAMES[phase.reg], { fontFamily: 'Luckiest Guy', fontSize: '15px', color: '#f6e7c4', stroke: '#1b1420', strokeThickness: 5 }).setOrigin(0.5, 0);
    const info = this.add.text(0, NODE_RADIUS + 28, '', { fontFamily: 'Nunito', fontStyle: '900', fontSize: '11px', color: '#ffffff', stroke: '#1b1420', strokeThickness: 4 }).setOrigin(0.5, 0);
    c.add([ring, disc, num, lock, star, name, info]);
    this.tweens.add({ targets: ring, scale: 1.25, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.inOut' });
    const index = PHASES.indexOf(phase);
    const node = { phase, index, color, x: pos.x, y: pos.y, c, ring, disc, num, lock, star, info, forceLocked: index === this.revealIndex };
    this.refreshNode(node);
    return node;
  }

  isLocked(i) {
    return !isPhaseUnlocked(i) || !!(this.nodes && this.nodes[i] && this.nodes[i].forceLocked);
  }

  refreshNode(node) {
    const locked = node.forceLocked || !isPhaseUnlocked(node.index);
    node.disc.setFillStyle(locked ? LOCKED_FILL : node.color);
    node.num.setVisible(!locked);
    node.lock.setVisible(locked).setScale(1).setAlpha(1).setAngle(0);
    if (locked) {
      node.star.setVisible(false);
      node.info.setText(`Vença ♛ ${GUARDIAN_NAMES[PHASES[node.index - 1].reg]} para abrir`);
      return;
    }
    const p = phaseProgress(node.phase.id);
    node.star.setVisible(p.complete);
    node.info.setText(`Baús ${p.chests.done}/${p.chests.total} · Segredos ${p.secrets.done}/${p.secrets.total} · ♛ ${p.guardians.done}/${p.guardians.total}`);
  }

  /** Último nó aberto (considerando o que ainda vai ser revelado). */
  lastOpenIndex() {
    let i = 0;
    while (i + 1 < this.nodes.length && !this.isLocked(i + 1)) i++;
    return i;
  }

  /** Cadeado quebra, nó ganha cor e o herói caminha até a fase nova. */
  playUnlock(i) {
    const node = this.nodes[i], k = 1 / this.zoom;
    this.tweens.add({
      targets: node.lock, angle: { from: -18, to: 18 }, yoyo: true, repeat: 3, duration: 90,
      onComplete: () => {
        this.tweens.add({ targets: node.lock, scale: 2, alpha: 0, duration: 350, ease: 'Cubic.out' });
        node.forceLocked = false;
        node.disc.setFillStyle(node.color);
        node.num.setVisible(true);
        this.tweens.add({ targets: [node.disc, node.num], scale: { from: 0.5, to: 1 }, duration: 600, ease: 'Back.Out' });
        for (let j = 0; j < 16; j++) {
          const a = j / 16 * Math.PI * 2;
          const sp = this.add.rectangle(node.x, node.y, 6 * k, 6 * k, j % 2 ? 0xffd95e : node.color).setDepth(9300);
          this.tweens.add({ targets: sp, x: node.x + Math.cos(a) * 60 * k, y: node.y + Math.sin(a) * 60 * k, alpha: 0, duration: 700, ease: 'Cubic.out', onComplete: () => sp.destroy() });
        }
        this.cameras.main.flash(250, 255, 240, 200);
        this.drawPath(k);
        bus.emit(EVENTS.TOAST, `Fase ${node.phase.number} liberada: ${REGION_NAMES[node.phase.reg]}!`);
        this.time.delayedCall(700, () => {
          this.refreshNode(node);
          this.locked = false;
          this.walkTo(i);
        });
      },
    });
  }

  createHero() {
    makeLook(this, 'hero');
    const n = this.nodes[this.current];
    this.hero = this.add.sprite(n.x, n.y, 'ch_hero', 0).setOrigin(0.5, 0.95).setDepth(9200);
    this.hero.dir = 'down';
    face(this.hero, 0, 0, false);
    this.highlight();
  }

  /** Ajusta zoom e escala dos elementos ao tamanho da tela. */
  layout() {
    const cam = this.cameras.main, f = this.frame;
    const zoom = Math.min(this.scale.width / f.w, this.scale.height / f.h);
    cam.setZoom(zoom);
    cam.centerOn(f.x + f.w / 2, f.y + f.h / 2);
    this.zoom = zoom;
    const k = 1 / zoom; // 1 px na tela
    for (const n of this.nodes) n.c.setScale(k);
    this.hero.setScale(0.6 * k);
    this.placeHero();
    this.drawPath(k);
  }

  drawPath(k) {
    const g = this.pathGfx.clear();
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i], b = this.nodes[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.round(len / (DOT_GAP * k)));
      const alpha = this.isLocked(i + 1) ? 0.35 : 1; // trecho até fase trancada fica apagado
      for (let s = 1; s < steps; s++) {
        const t = s / steps, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        g.fillStyle(0x3a2408, alpha).fillCircle(x, y, 5.5 * k);
        g.fillStyle(0xf6e7c4, alpha).fillCircle(x, y, 3.5 * k);
      }
    }
  }

  placeHero() {
    if (this.moving) return;
    const n = this.nodes[this.current];
    this.hero.setPosition(n.x, n.y - 8 / this.zoom);
  }

  highlight() {
    this.nodes.forEach((n, i) => n.ring.setAlpha(i === this.current ? 1 : 0));
  }

  /* ---------- entrada ---------- */

  update() {
    releaseStuckLock(this, state.intro);
  }

  onKey(k) {
    if (this.locked || this.moving) return;
    if (k === 'R' || k === 'D') this.walkTo(this.current + 1);
    else if (k === 'L' || k === 'U') this.walkTo(this.current - 1);
    else if (k === 'A') this.enterPhase();
  }

  onTap(wx, wy) {
    if (this.moving) return;
    const hit = this.nodes.findIndex(n => Math.hypot(n.x - wx, n.y - wy) <= (NODE_RADIUS + 12) / this.zoom);
    if (hit < 0) return;
    if (hit === this.current) this.enterPhase();
    else this.walkTo(hit);
  }

  /** Anda nó a nó pelo caminho até o índice `target`. */
  async walkTo(target) {
    target = Math.max(0, Math.min(this.nodes.length - 1, target));
    const limit = this.lastOpenIndex();
    if (target > limit) {
      const locked = this.nodes[limit + 1], prev = PHASES[limit];
      bus.emit(EVENTS.TOAST, `Fase trancada: vença ♛ ${GUARDIAN_NAMES[prev.reg]} em ${REGION_NAMES[prev.reg]}`);
      this.tweens.add({ targets: locked.lock, angle: { from: -15, to: 15 }, yoyo: true, repeat: 2, duration: 70, onComplete: () => locked.lock.setAngle(0) });
      target = limit;
    }
    if (target === this.current) return;
    this.moving = true;
    const dir = Math.sign(target - this.current);
    while (this.current !== target) {
      const next = this.nodes[this.current + dir];
      face(this.hero, next.x - this.hero.x, next.y - this.hero.y, true);
      await new Promise(resolve => this.tweens.add({ targets: this.hero, x: next.x, y: next.y - 8 / this.zoom, duration: STEP_MS, onComplete: resolve }));
      this.current += dir;
      this.highlight();
    }
    face(this.hero, 0, 0, false);
    this.moving = false;
    this.prepaint(this.current);
    state.phase = this.nodes[this.current].phase.id;
    saveState();
    bus.emit(EVENTS.TOAST, REGION_NAMES[this.nodes[this.current].phase.reg]);
  }

  /**
   * Pinta em segundo plano (Web Worker) o chão da fase do nó atual enquanto o jogador está
   * no mapa, para a entrada ser imediata. Só uma fase fica pintada na memória.
   */
  prepaint(index) {
    const target = MAPS[phaseMapId(PHASES[index].id)];
    for (const p of PHASES) { const m = MAPS[phaseMapId(p.id)]; if (m !== target) releasePaint(m); }
    return paintMapAsync(target);
  }

  async enterPhase() {
    const phase = this.nodes[this.current].phase;
    this.locked = true; this.moving = true;
    if (!MAPS[phaseMapId(phase.id)].canvas) {
      bus.emit(EVENTS.TOAST, 'Desenhando a fase…');
      await this.prepaint(this.current);
    }
    state.phase = phase.id;
    saveState();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('fase', { map: phaseMapId(phase.id) }));
  }
}

/** Centro (em px) da terra de uma região, ajustado para cair num tile da própria região. */
function regionCenter(m, reg) {
  const tiles = [];
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (m.reg[y][x] === reg && !BLOCK_BIO[m.bio[y][x]]) tiles.push([x, y]);
  const cx = tiles.reduce((a, t) => a + t[0], 0) / tiles.length, cy = tiles.reduce((a, t) => a + t[1], 0) / tiles.length;
  const [x, y] = tiles.reduce((b, t) => (Math.hypot(t[0] - cx, t[1] - cy) < Math.hypot(b[0] - cx, b[1] - cy) ? t : b));
  return { x: x * T + T / 2, y: y * T + T / 2 };
}

/** Retângulo (em px) que enquadra a terra da ilha com margem. */
function landFrame(m) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    if (BLOCK_BIO[m.bio[y][x]]) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x: (x0 - FRAME_PAD) * T, y: (y0 - FRAME_PAD) * T, w: (x1 - x0 + 1 + 2 * FRAME_PAD) * T, h: (y1 - y0 + 1 + 2 * FRAME_PAD) * T };
}
