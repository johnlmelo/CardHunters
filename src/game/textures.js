/* Registro de texturas no Phaser a partir das artes geradas em canvas. */
import Phaser from 'phaser';
import { characterFrames } from '../art/characters.js';
import { paintPixels } from '../art/canvas.js';

/** Registra (uma vez) a textura `key` gerada por `make()`. */
export function artTex(sc, key, make) {
  if (!sc.textures.exists(key)) {
    sc.textures.addCanvas(key, make());
    sc.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  return key;
}

/** Folha de sprite e animações (down/up/side) de um personagem. Devolve a chave da textura. */
export function makeLook(sc, name) {
  const key = 'ch_' + name;
  if (sc.textures.exists(key)) return key;
  const fr = characterFrames(name), tex = sc.textures.createCanvas(key, 64 * fr.length, 80), ctx = tex.getContext();
  fr.forEach((a, f) => paintPixels(ctx, a, f * 64, 0));
  tex.refresh();
  fr.forEach((_, i) => tex.add(i, 0, i * 64, 0, 64, 80));
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const an = (n, f, r) => sc.anims.create({ key: key + '_' + n, frames: f.map(i => ({ key, frame: i })), frameRate: r, repeat: -1 });
  an('down', [0, 1, 0, 2], 8);
  an('up', [3, 4, 3, 5], 8);
  an('side', [6, 7, 6, 8], 9);
  return key;
}
