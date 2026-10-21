/*
 * Cena de exploração de uma fase (região da ilha) ou caverna. Desenha o mapa, move o herói
 * e os duelistas, e avisa pelo barramento quando o herói encosta num baú ou num duelista.
 */
import Phaser from 'phaser';
import { TILE as T } from '../config/constants.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { N4 } from '../core/math.js';
import { phaseById, phaseMapId, phaseOfCave } from '../data/phases.js';
import { REGION_NAMES } from '../data/world.js';
import { artCanvas, radialCanvas, waterTileCanvas } from '../art/canvas.js';
import { LOOKS } from '../art/characters.js';
import { paintMap, releasePaint } from '../art/groundPainter.js';
import { propArt } from '../art/props.js';
import { state, saveState } from '../state/gameState.js';
import { isBossBeaten } from '../state/phaseProgress.js';
import { isChestOpened, isSecretFound, markChestOpened, markSecretFound, setPosition } from '../state/progress.js';
import { findPath } from '../world/pathfinding.js';
import { walkOn } from '../world/tiles.js';
import { MAPS, buildWorld, isPlayableMap } from '../world/world.js';
import { face } from './characterAnimator.js';
import { onKeyPress, pressedKeys } from './keyboard.js';
import { createPortal } from './portalFx.js';
import { releaseStuckLock, setActiveScene } from './session.js';
import { artTex, makeLook } from './textures.js';

const HERO_SPEED = 150; // pixels por segundo
const AUTO_SAVE_MS = 2000;

/** Fase a que o mapa pertence (a própria fase ou a dona da caverna). */
const familyOf = m => m.phaseId || (phaseOfCave(m.id) || {}).id;

/** Distância (px) do herói ao baú para poder abri-lo: o tile do baú ou um vizinho. */
const CHEST_REACH = 40;
/** Toque/clique a esta distância (px) do centro do baú conta como tocar nele. */
const CHEST_TAP = 26;
/** Telas de toque não têm teclado: o balão do baú pede um toque em vez de Espaço. */
const isTouch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const toast = msg => bus.emit(EVENTS.TOAST, msg);
const refreshHud = () => bus.emit(EVENTS.HUD_REFRESH);


export class StageScene extends Phaser.Scene {
  constructor() { super('fase'); }

  create(data) {
    setActiveScene(this);
    this.locked = true; this.path = []; this.moving = false; this.errShown = 0; this.sea = null; this.dark = null; this.idleLock = 0;
    buildWorld();
    const id = data && isPlayableMap(data.map) ? data.map : phaseMapId(state.phase);
    const m = MAPS[id];
    this.map = m;
    this.phase = m.phaseId ? phaseById(m.phaseId) : null; // cavernas não têm chefe
    this.exitPortal = null;

    this.createTextures();
    this.createGround(m, id);
    this.createProps(m);
    this.createChests(m);
    this.createNpcs(m);
    this.createHero(m, id, data);
    this.createAtmosphere(m);
    this.createCamera(m);
    bus.emit(EVENTS.SCENE_CHANGED, { kind: 'stage', name: m.name });
    const offDefeat = bus.on(EVENTS.DUELIST_DEFEATED, ({ id }) => this.onDuelistDefeated(id));
    const offKeys = onKeyPress(k => { if (k === 'A') this.openNearChest(); });
    this.events.once('shutdown', () => { offDefeat(); offKeys(); });

    this.lastReg = m.reg[this.ht.y] ? m.reg[this.ht.y][this.ht.x] : null; this.lastSave = 0;
    refreshHud();
    toast(m.name);
    if (m.dark && !isSecretFound(m.id)) {
      markSecretFound(m.id); saveState(); refreshHud();
      setTimeout(() => toast('Lugar secreto descoberto: ' + m.name + '!'), 1600);
    }
    if (!state.intro) bus.emit(EVENTS.INTRO_REQUEST);
    else this.time.delayedCall(360, () => { this.locked = false; });
  }

  createTextures() {
    makeLook(this, 'hero');
    artTex(this, 'chest', () => artCanvas(propArt('chest')));
    artTex(this, 'chestOpen', () => artCanvas(propArt('chestOpen')));
    artTex(this, 'glow', () => radialCanvas(128, [[0, 'rgba(255,255,255,.9)'], [0.35, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]));
  }

  createGround(m, id) {
    if (m.water) {
      artTex(this, 'waterTile', waterTileCanvas);
      this.sea = this.add.tileSprite(-640, -640, m.W * T + 1280, m.H * T + 1280, 'waterTile').setOrigin(0).setDepth(-20);
    } else this.add.rectangle(-640, -640, m.W * T + 1280, m.H * T + 1280, 0x050405).setOrigin(0).setDepth(-20);
    // o chão de uma fase é grande: só a fase atual (e suas cavernas) fica pintada na memória
    const family = familyOf(m);
    for (const other of Object.values(MAPS)) {
      if (other.id === 'ilha' || familyOf(other) === family) continue;
      releasePaint(other);
      if (this.textures.exists('ground_' + other.id)) this.textures.remove('ground_' + other.id);
    }
    const key = 'ground_' + id;
    paintMap(m); // já pronto se o mapa de fases pintou antes; senão termina agora
    if (!this.textures.exists(key)) this.textures.addCanvas(key, m.canvas);
    this.add.image(0, 0, key).setOrigin(0).setDepth(-10);
  }

  createProps(m) {
    this.fakes = []; this.lights = [];
    for (const p of m.props) {
      const key = artTex(this, 'prop_' + p.k, () => artCanvas(propArt(p.k)));
      const img = this.add.image(p.px, p.py, key).setOrigin(0.5, 1).setDepth(p.flat ? -5 : p.py);
      if (p.fake) this.fakes.push({ x: p.tx, y: p.ty, img });
      if (p.glow) {
        const g = this.add.image(p.px, p.py - (p.k === 'poste' ? 48 : p.k === 'tocha' ? 26 : 14), 'glow')
          .setTint(Phaser.Display.Color.HexStringToColor(p.glow).color).setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(9500).setScale(m.dark ? 1.3 : 0.5).setAlpha(m.dark ? 0.8 : 0.35);
        this.lights.push(g);
        this.tweens.add({ targets: g, alpha: g.alpha * 0.6, yoyo: true, repeat: -1, duration: 900 + Math.random() * 700, ease: 'Sine.inOut' });
      }
    }
  }

  createChests(m) {
    this.chests = m.chests.map(c => {
      const opened = isChestOpened(c.id);
      const spr = this.add.image(c.x * T + 16, c.y * T + 30, opened ? 'chestOpen' : 'chest').setOrigin(0.5, 1).setDepth(c.y * T + 30);
      if (opened) spr.setAlpha(0.7);
      else this.tweens.add({ targets: spr, y: spr.y - 3, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
      return { ...c, spr };
    });
    this.nearChest = null;
    this.createChestPrompt();
  }

  createNpcs(m) {
    // chefe já vencido não volta: no lugar dele fica o portal de saída
    const bossDone = this.phase && isBossBeaten(this.phase);
    const boss = bossDone && m.npcs.find(sp => sp.nid === this.phase.boss);
    if (boss) this.placeExitPortal(boss.x, boss.y, false);
    this.npcs = m.npcs.filter(sp => sp !== boss).map(sp => {
      const key = makeLook(this, LOOKS[sp.look] ? sp.look : sp.type);
      const spr = this.add.sprite(sp.x * T + 16, sp.y * T + 24, key, 0).setOrigin(0.5, 0.95).setScale(sp.guardian ? 0.8 : 2 / 3);
      spr.dir = 'down';
      spr.shadow = this.add.ellipse(spr.x, spr.y + 2, sp.guardian ? 30 : 24, 8, 0x000000, 0.28);
      const tag = this.add.text(0, 0, (sp.guardian ? '♛ ' : '') + sp.name, {
        fontFamily: 'Nunito', fontStyle: '900', fontSize: '12px', color: sp.guardian ? '#ffd95e' : '#ffffff', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5, 1);
      return { id: sp.nid, x: sp.x, y: sp.y, type: sp.type, name: sp.name, guardian: sp.guardian, still: sp.still, spr, tag, reg: sp.reg };
    });
    // duelistas comuns passeiam pela própria região
    const rnd = Math.random;
    this.time.addEvent({
      delay: 1600, loop: true, callback: () => {
        if (this.locked) return;
        try {
          for (const n of this.npcs) {
            if (n.guardian || n.still || rnd() < 0.4) continue;
            const opts = N4.map(([a, b]) => [n.x + a, n.y + b]).filter(([X, Y]) => walkOn(m, X, Y) && m.reg[Y][X] === n.reg && !m.road[Y][X]
              && !this.chests.some(c => c.x === X && c.y === Y) && !m.portals.some(p => p.x === X && p.y === Y));
            if (!opts.length) continue;
            const [X, Y] = opts[Math.floor(rnd() * opts.length)];
            face(n.spr, X - n.x, Y - n.y, true);
            n.x = X; n.y = Y;
            this.tweens.add({ targets: n.spr, x: X * T + 16, y: Y * T + 24, duration: 650, onComplete: () => face(n.spr, 0, 0, false) });
          }
        } catch (e) { console.error(e); }
      },
    });
  }

  createHero(m, id, data) {
    const where = state.where && state.where.map === id ? state.where : null;
    let sx = data && data.x != null ? data.x : where ? where.x : m.start.x;
    let sy = data && data.y != null ? data.y : where ? where.y : m.start.y;
    if (!walkOn(m, sx, sy)) { sx = m.start.x; sy = m.start.y; }
    this.ht = { x: sx, y: sy };
    this.hero = this.add.sprite(sx * T + 16, sy * T + 24, 'ch_hero', 0).setOrigin(0.5, 0.95).setScale(2 / 3);
    this.hero.dir = (data && data.dir) || 'down';
    face(this.hero, 0, 0, false);
    this.heroShadow = this.add.ellipse(0, 0, 24, 8, 0x000000, 0.28);
  }

  createAtmosphere(m) {
    if (m.dark) { // escuridão das cavernas
      artTex(this, 'darkness', () => radialCanvas(2048, [[0, 'rgba(0,0,0,0)'], [0.06, 'rgba(0,0,0,0)'], [0.16, 'rgba(0,0,0,.72)'], [0.3, 'rgba(0,0,0,.93)'], [1, 'rgba(0,0,0,.96)']]));
      this.dark = this.add.image(this.hero.x, this.hero.y, 'darkness').setDepth(9000);
      return;
    }
    // sombras de nuvens passando
    artTex(this, 'cloud', () => radialCanvas(256, [[0, 'rgba(0,10,20,.16)'], [0.6, 'rgba(0,10,20,.08)'], [1, 'rgba(0,10,20,0)']]));
    for (let i = 0; i < 5; i++) {
      const c = this.add.image(Math.random() * m.W * T, Math.random() * m.H * T, 'cloud').setScale(2.5 + Math.random() * 2, 1.6 + Math.random()).setDepth(8800);
      this.tweens.add({ targets: c, x: c.x + m.W * T * 0.6, duration: 90000 + Math.random() * 60000, repeat: -1, onRepeat: () => { c.x = -400; c.y = Math.random() * m.H * T; } });
    }
    // brilhos no mar
    this.sparkles = [];
    for (let i = 0; i < 26; i++) {
      let x, y, t = 0;
      do { x = Math.floor(Math.random() * m.W); y = Math.floor(Math.random() * m.H); t++; } while (m.bio[y][x] !== 'agua' && t < 50);
      const s = this.add.rectangle(x * T + Math.random() * T, y * T + Math.random() * T, 4, 2, 0xffffff).setDepth(-9).setAlpha(0);
      this.tweens.add({ targets: s, alpha: 0.8, yoyo: true, repeat: -1, delay: Math.random() * 4000, duration: 600, hold: 200, repeatDelay: 2500 + Math.random() * 3000 });
    }
  }

  createCamera(m) {
    const cam = this.cameras.main;
    const pad = m.water ? 320 : T;
    cam.setBounds(-pad, -pad, m.W * T + 2 * pad, m.H * T + 2 * pad);
    cam.startFollow(this.hero, true, 0.12, 0.12);
    const fit = () => cam.setZoom(Math.min(this.scale.width, this.scale.height) < 520 ? 1.25 : 1.5);
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
    cam.fadeIn(350, 0, 0, 0);
    this.marker = this.add.circle(0, 0, 8, 0xffffff, 0).setStrokeStyle(3, 0xffffff).setAlpha(0).setDepth(5);
  }

  onTap(wx, wy) {
    const c = this.nearChest;
    if (c && Math.hypot(wx - c.spr.x, wy - (c.spr.y - 17)) <= CHEST_TAP) { this.openNearChest(); return; }
    this.goTo(Math.floor(wx / T), Math.floor(wy / T));
  }

  /* ---------- chefe e portal de saída ---------- */

  placeExitPortal(tx, ty, animate) {
    this.exitPortal = { x: tx, y: ty, fx: createPortal(this, tx * T + 16, ty * T + 30, { animate }) };
  }

  onDuelistDefeated(id) {
    if (!this.phase || id !== this.phase.boss || this.exitPortal) return;
    const n = this.npcs.find(x => x.id === id);
    if (n) this.openBossPortal(n);
  }

  /** O chefe some girando e um portal se abre no lugar dele. */
  openBossPortal(n) {
    this.locked = true; this.moving = true; this.path = [];
    this.npcs = this.npcs.filter(x => x !== n);
    const cam = this.cameras.main, px = n.x * T + 16, py = n.y * T + 24;
    cam.stopFollow();
    cam.pan(px, py - 20, 500, 'Sine.easeInOut');
    this.tweens.add({ targets: n.tag, alpha: 0, duration: 300 });
    this.tweens.add({ targets: n.spr.shadow, alpha: 0, duration: 600 });
    this.tweens.add({
      targets: n.spr, angle: 720, scale: 0, alpha: 0, delay: 500, duration: 900, ease: 'Cubic.in',
      onComplete: () => {
        n.spr.shadow.destroy(); n.spr.destroy(); n.tag.destroy();
        cam.flash(350, 180, 240, 255);
        cam.shake(400, 0.006);
        this.placeExitPortal(n.x, n.y, true);
        toast(`Um portal se abriu! Entre nele para seguir viagem.`);
        this.time.delayedCall(1400, () => {
          cam.pan(this.hero.x, this.hero.y, 500, 'Sine.easeInOut', false, (c, t) => {
            if (t < 1) return;
            cam.startFollow(this.hero, true, 0.12, 0.12);
            this.locked = false; this.moving = false;
          });
        });
      },
    });
  }

  /** O herói é sugado pelo portal e volta ao mapa, liberando a próxima fase. */
  enterExitPortal() {
    this.locked = true; this.moving = true; this.path = [];
    setPosition(this.map.id, this.map.start.x, this.map.start.y);
    saveState();
    const p = this.exitPortal.fx, cam = this.cameras.main;
    this.tweens.add({ targets: this.hero, x: p.x, y: p.y + 20, angle: 540, scale: 0, alpha: 0, duration: 800, ease: 'Cubic.in' });
    this.tweens.add({ targets: this.heroShadow, alpha: 0, duration: 400 });
    cam.zoomTo(cam.zoom * 1.6, 900, 'Sine.easeIn');
    cam.fadeOut(900, 230, 255, 251);
    cam.once('camerafadeoutcomplete', () => this.scene.start('mapa', { cleared: this.phase.id }));
  }

  /** Volta para o mapa de fases. */
  exitToMap() {
    this.locked = true; this.moving = true; this.path = [];
    setPosition(this.map.id, this.ht.x, this.ht.y);
    saveState();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('mapa'));
  }

  /** Planeja o caminho até o tile tocado. */
  goTo(tx, ty) {
    const from = this.path.length ? this.path[0] : [this.ht.x, this.ht.y];
    const p = findPath(this.map, from[0], from[1], tx, ty);
    if (!p) return;
    this.path = this.path.length ? [this.path[0], ...p] : p;
    this.marker.setPosition(tx * T + 16, ty * T + 16).setAlpha(1).setScale(1);
    this.tweens.add({ targets: this.marker, alpha: 0, scale: 1.8, duration: 500 });
  }

  update(time, dt) {
    // um erro aqui não pode parar o laço do jogo
    try { this.tick(time, dt); } catch (err) {
      console.error(err);
      if (!this.errShown) { this.errShown = 1; toast('Erro no mapa: ' + ((err && err.message) || err)); }
    }
  }

  tick(time, dt) {
    if (this.sea) this.sea.tilePositionX += dt * 0.004;
    this.readKeyboard();
    const h = this.hero;
    if (this.path.length) {
      const [tx, ty] = this.path[0];
      const X = tx * T + 16, Y = ty * T + 24, step = HERO_SPEED * dt / 1000, ddx = X - h.x, ddy = Y - h.y, dist = Math.hypot(ddx, ddy);
      if (dist > 0.5) face(h, ddx, ddy, true);
      if (dist <= step) {
        h.setPosition(X, Y);
        this.ht = { x: tx, y: ty };
        this.path.shift();
        this.onTile();
        if (this.locked) return;
      } else h.setPosition(h.x + ddx / dist * step, h.y + ddy / dist * step);
    } else if (h.anims.isPlaying) face(h, 0, 0, false);

    this.syncDepths();
    releaseStuckLock(this, state.intro);
    // o duelista só desafia de novo depois que o herói se afasta
    for (const n of this.npcs) if (n.armed === false && Math.hypot(n.spr.x - h.x, n.spr.y - h.y) > 56) n.armed = true;
    if (this.locked) { this.setNearChest(null); return; }
    this.checkEncounters();
  }

  readKeyboard() {
    if (this.path.length || this.locked) return;
    let dx = 0, dy = 0;
    if (pressedKeys.has('L')) dx = -1; else if (pressedKeys.has('R')) dx = 1; else if (pressedKeys.has('U')) dy = -1; else if (pressedKeys.has('D')) dy = 1;
    if ((dx || dy) && walkOn(this.map, this.ht.x + dx, this.ht.y + dy)) this.path = [[this.ht.x + dx, this.ht.y + dy]];
  }

  syncDepths() {
    const h = this.hero;
    h.setDepth(h.y);
    this.heroShadow.setPosition(h.x, h.y + 2).setDepth(h.y - 1);
    if (this.dark) this.dark.setPosition(h.x, h.y - 20);
    // passagens falsas ficam translúcidas quando o herói chega perto
    for (const f of this.fakes) f.img.setAlpha(Math.abs(f.x - this.ht.x) <= 1 && Math.abs(f.y - this.ht.y) <= 1 ? 0.45 : 1);
    for (const n of this.npcs) {
      n.spr.setDepth(n.spr.y);
      n.spr.shadow.setPosition(n.spr.x, n.spr.y + 2).setDepth(n.spr.y - 1);
      n.tag.setPosition(n.spr.x, n.spr.y - (n.guardian ? 64 : 54)).setDepth(9999);
    }
  }

  checkEncounters() {
    const h = this.hero;
    // baú: só mostra o balão; abre com Espaço (ou tocando nele)
    let near = null, best = CHEST_REACH;
    for (const c of this.chests) {
      if (isChestOpened(c.id)) continue;
      const d = Math.hypot(c.spr.x - h.x, c.spr.y - (h.y + 6));
      if (d < best) { best = d; near = c; }
    }
    this.setNearChest(near);
    for (const n of this.npcs) if (n.armed !== false && Math.hypot(n.spr.x - h.x, n.spr.y - h.y) < 24) { n.armed = false; bus.emit(EVENTS.NPC_CHALLENGE, n); return; }
  }

  /* ---------- baú: balão e abertura ---------- */

  createChestPrompt() {
    const label = isTouch() ? 'Toque para abrir' : 'abrir';
    const txt = this.add.text(0, 0, label, { fontFamily: 'Nunito', fontStyle: '900', fontSize: '12px', color: '#3a2408' }).setOrigin(0, 0.5);
    const parts = [];
    let w = txt.width + 16;
    if (!isTouch()) {
      const key = this.add.text(0, 0, 'Espaço', { fontFamily: 'Nunito', fontStyle: '900', fontSize: '11px', color: '#f6e7c4' }).setOrigin(0, 0.5);
      const kw = key.width + 10;
      const cap = this.add.graphics().fillStyle(0x3a2408, 1).fillRoundedRect(0, -9, kw, 18, 4);
      parts.push(cap, key.setX(5));
      txt.setX(kw + 5);
      w = kw + 5 + txt.width + 8;
    } else txt.setX(0);
    const bg = this.add.graphics();
    bg.fillStyle(0xf6e7c4, 0.95).fillRoundedRect(-6, -13, w + 4, 26, 8).lineStyle(2, 0x3a2408, 1).strokeRoundedRect(-6, -13, w + 4, 26, 8);
    bg.fillStyle(0xf6e7c4, 0.95).fillTriangle(w / 2 - 8, 12, w / 2 + 2, 12, w / 2 - 3, 19);
    this.chestPrompt = this.add.container(0, 0, [bg, ...parts, txt]).setDepth(9999).setVisible(false);
    this.chestPromptWidth = w;
    this.tweens.add({ targets: this.chestPrompt, scaleX: 1.05, scaleY: 1.05, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.inOut' });
  }

  setNearChest(c) {
    if (c === this.nearChest) return;
    this.nearChest = c;
    this.chestPrompt.setVisible(!!c);
    if (c) this.chestPrompt.setPosition(c.spr.x - this.chestPromptWidth / 2 + 2, c.spr.y - 52);
  }

  openNearChest() {
    const c = this.nearChest;
    if (!c || this.locked || isChestOpened(c.id)) return;
    this.setNearChest(null);
    this.openChest(c);
  }

  openChest(c) {
    markChestOpened(c.id);
    c.spr.setTexture('chestOpen').setAlpha(0.7);
    this.tweens.killTweensOf(c.spr);
    bus.emit(EVENTS.CHEST_REACHED, c);
  }

  /** Chegou num tile: portais, segredos, nome da região e salvamento periódico. */
  onTile() {
    const m = this.map, { x, y } = this.ht;
    // portal de saída (chefe vencido)
    if (this.exitPortal && x === this.exitPortal.x && y === this.exitPortal.y) { this.enterExitPortal(); return; }
    // portais (cavernas)
    const p = m.portals.find(p => p.x === x && p.y === y);
    if (p && p.ax != null) {
      this.locked = true; this.moving = true; this.path = [];
      const dest = p.to;
      setPosition(dest, p.ax, p.ay); saveState();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ map: dest, x: p.ax, y: p.ay, dir: MAPS[dest].dark ? 'up' : 'down' }));
      return;
    }
    // segredos ao ar livre
    for (const s of m.secrets) {
      if (!isSecretFound(s.id) && Math.hypot(x - s.x, y - s.y) <= s.r) {
        markSecretFound(s.id); saveState(); refreshHud();
        toast('Lugar secreto descoberto: ' + s.name + '!');
      }
    }
    if (!m.dark) { const r = m.reg[y][x]; if (r !== this.lastReg) { this.lastReg = r; toast(REGION_NAMES[r]); } }
    const now = Date.now();
    if (now - this.lastSave > AUTO_SAVE_MS) { this.lastSave = now; setPosition(m.id, x, y); saveState(); }
  }
}
