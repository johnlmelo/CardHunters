/* Portal de saída da fase: redemoinho girando, brilho pulsando e faíscas sendo sugadas. */
import Phaser from 'phaser';
import { portalSwirlCanvas } from '../art/portal.js';
import { radialCanvas } from '../art/canvas.js';
import { artTex } from './textures.js';

const WIDTH = 40, HEIGHT = 64; // tamanho do portal (oval em pé)

/**
 * Cria o portal com a base em (x, groundY).
 * Com `animate`, ele nasce crescendo com um estouro de faíscas.
 */
export function createPortal(scene, x, groundY, { animate = false } = {}) {
  artTex(scene, 'portalSwirl', () => portalSwirlCanvas(96));
  artTex(scene, 'glow', () => radialCanvas(128, [[0, 'rgba(255,255,255,.9)'], [0.35, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]));
  const cy = groundY - HEIGHT / 2;
  const c = scene.add.container(x, cy).setDepth(groundY);

  const glow = scene.add.image(0, 0, 'glow').setTint(0x7fe0d6).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9, 1.3).setAlpha(0.75);
  const swirlWrap = scene.add.container(0, 0).setScale(WIDTH / 96, HEIGHT / 96);
  const swirl = scene.add.image(0, 0, 'portalSwirl');
  swirlWrap.add(swirl);
  const rim = scene.add.ellipse(0, 0, WIDTH + 4, HEIGHT + 4).setFillStyle().setStrokeStyle(3, 0xb58bf0);
  const base = scene.add.ellipse(0, HEIGHT / 2, WIDTH + 10, 10, 0x000000, 0.3);
  c.add([base, glow, swirlWrap, rim]);

  scene.tweens.add({ targets: swirl, angle: 360, repeat: -1, duration: 1600 });
  scene.tweens.add({ targets: glow, alpha: 0.4, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: rim, scaleX: 1.08, scaleY: 1.04, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.inOut' });

  // faíscas sendo sugadas para o centro
  const spark = scene.time.addEvent({
    delay: 140, loop: true, callback: () => {
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 14;
      const s = scene.add.rectangle(x + Math.cos(a) * r, cy + Math.sin(a) * r * 1.4, 3, 3, Math.random() < 0.5 ? 0xe6fffb : 0xb58bf0).setDepth(groundY + 1);
      scene.tweens.add({ targets: s, x, y: cy, scale: 0, alpha: 0.2, duration: 600, ease: 'Quad.in', onComplete: () => s.destroy() });
    },
  });
  c.once('destroy', () => spark.remove());

  if (animate) {
    c.setScale(0);
    scene.tweens.add({ targets: c, scale: 1, duration: 750, ease: 'Back.Out' });
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2;
      const s = scene.add.rectangle(x, cy, 4, 4, i % 2 ? 0xffd95e : 0x7fe0d6).setDepth(groundY + 2);
      scene.tweens.add({ targets: s, x: x + Math.cos(a) * 70, y: cy + Math.sin(a) * 70, alpha: 0, scale: 0.3, duration: 800, ease: 'Cubic.out', onComplete: () => s.destroy() });
    }
  }
  return c;
}
