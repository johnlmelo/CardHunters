/* Orientação e animação de passo de um sprite de personagem. */

const IDLE_FRAME = { down: 0, up: 3, side: 6 };

/** Vira o sprite na direção (dx, dy) e anima se estiver andando. */
export function face(spr, dx, dy, moving) {
  let dir = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down';
  if (!dx && !dy) dir = spr.dir || 'down';
  if (dir === 'side') { if (dx) spr.setFlipX(dx < 0); } else spr.setFlipX(false);
  spr.dir = dir;
  if (moving) spr.anims.play(spr.texture.key + '_' + dir, true);
  else { spr.anims.stop(); spr.setFrame(IDLE_FRAME[dir]); }
}
