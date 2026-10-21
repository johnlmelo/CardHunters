/* Ícones dos equipamentos em pixel art (16×16, com contorno numa tela 18×18). */
import { ITEMS } from '../data/items.js';
import { MONSTER_PALETTE as MC } from './palettes.js';
import { OUTLINE_DIRS, createPixelGrid } from './pixelGrid.js';

const ICONS = {
  coin(r,e){e(8,8,6,6,'auD');e(8,8,5,5,'au');e(8,8,3,3,'auL');r(7,5,2,6,'auD')},
  anchor(r,e){r(7,3,2,10,'auD');r(4,5,8,2,'auD');e(8,2,2,2,'au');r(8,2,1,1,'dk');r(2,10,2,3,'auD');r(12,10,2,3,'auD');r(3,12,10,2,'auD');r(8,4,1,8,'au')},
  sword(r,e){r(7,1,2,9,'gyL');r(8,1,1,9,'wh');r(7,0,2,1,'gyL');r(3,10,10,2,'au');r(3,10,10,1,'auL');r(7,12,2,3,'br');e(8,15,2,1,'au')},
  fang(r,e){r(2,1,12,3,'rd');r(2,1,12,1,'pk');for(let j=0;j<10;j++){const w=Math.max(1,4-Math.floor(j/3));r(3,4+j,w,1,'cr');r(13-w,4+j,w,1,'cr')}},
  shell(r,e){e(8,9,7,5,'grD');e(8,9,6,4,'gr');for(const x of[4,8,12])r(x,5,1,8,'grD');r(2,13,12,1,'brD')},
  drop(r,e){e(8,10,4,4,'rd');r(7,3,2,3,'rd');r(6,5,4,3,'rd');r(6,9,1,3,'pk');r(7,2,2,1,'rdD')},
  helmet(r,e){e(8,7,6,5,'gy');r(2,7,12,5,'gy');r(2,7,12,1,'gyL');r(4,9,8,1,'dk');r(7,1,2,2,'gyL');r(2,12,12,1,'gyD');r(7,10,2,2,'gyD')},
  pick(r,e){r(7,4,2,11,'br');r(7,4,1,11,'brL');r(3,2,10,2,'gyL');r(1,3,3,2,'gy');r(12,3,3,2,'gy');r(0,5,2,1,'gy');r(14,5,2,1,'gy')},
  spike(r,e){r(3,5,10,9,'gy');r(3,5,10,2,'gyL');r(2,2,2,3,'gyL');r(7,1,2,4,'gyL');r(12,2,2,3,'gyL');r(7,7,2,5,'gyD');r(3,13,10,1,'gyD')},
  scepter(r,e){r(7,6,2,9,'au');r(7,6,1,9,'auL');e(8,4,3,3,'pu');r(7,3,1,1,'puL');r(5,9,6,1,'auD');r(7,0,2,1,'ye')},
  cape(r,e){r(4,2,8,2,'au');for(let j=0;j<11;j++){const g=Math.floor(j/4);r(4-g,4+j,8+2*g,1,'pu')}r(7,4,2,11,'puD');r(4,4,1,6,'puL')},
  crown(r,e){r(2,8,12,5,'au');r(2,4,2,4,'au');r(7,3,2,5,'au');r(12,4,2,4,'au');r(4,10,2,2,'rd');r(10,10,2,2,'rd');r(7,9,2,2,'teL');r(2,12,12,1,'auD')},
  mask(r,e){e(5,8,4,5,'cr');e(11,8,4,5,'te');r(3,7,2,1,'dk');r(11,7,2,1,'dk');r(3,11,3,1,'dk');r(10,10,3,1,'dk');r(10,11,1,1,'dk');r(13,11,1,1,'dk')},
  veil(r,e){e(8,6,6,5,'teD');r(2,6,12,8,'teD');for(const x of[2,6,10])r(x,14,2,1,'teD');r(5,6,1,2,'tg');r(10,6,1,2,'tg');r(4,3,2,1,'te')},
  mirror(r,e){e(8,6,6,6,'gy');e(8,6,5,5,'teL');r(5,3,2,1,'wh');r(7,12,2,4,'br');r(9,4,1,1,'dk');r(10,5,1,1,'dk');r(9,6,1,1,'dk');r(10,7,1,2,'dk')}
};

const CACHE = {};
/** Ícone do equipamento `ik` como data URL. */
export function itemArt(ik) {
  if (CACHE[ik]) return CACHE[ik];
  const { grid: a, rect, ellipse } = createPixelGrid(16);
  ICONS[ITEMS[ik].icon](rect, ellipse);
  const c = document.createElement('canvas');
  c.width = 18; c.height = 18;
  const ctx = c.getContext('2d');
  // contorno nos vizinhos vazios
  a.forEach((row, y) => row.forEach((col, x) => {
    if (!col && OUTLINE_DIRS.some(([dx, dy]) => a[y + dy] && a[y + dy][x + dx])) { ctx.fillStyle = MC.dk; ctx.fillRect(x + 1, y + 1, 1, 1); }
  }));
  // contorno nas bordas externas e pixels do ícone
  a.forEach((row, y) => row.forEach((col, x) => {
    if (!col) return;
    for (const [dx, dy] of OUTLINE_DIRS) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X > 15 || Y > 15) { ctx.fillStyle = MC.dk; ctx.fillRect(X + 1, Y + 1, 1, 1); }
    }
    ctx.fillStyle = col;
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }));
  return CACHE[ik] = c.toDataURL();
}
