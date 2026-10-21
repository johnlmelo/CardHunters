/* Paletas de cor de todas as artes do jogo. */
import { hexToRgb } from './color.js';

/** Paleta dos Cativos e ícones de equipamento. */
export const MONSTER_PALETTE={dk:'#1b1420',wh:'#ffffff',cr:'#f4efe2',
  au:'#f2b632',auD:'#b97f12',auL:'#ffe18a',rd:'#d9442e',rdD:'#9e2a1f',pk:'#e05a6a',or:'#ff8a3a',ye:'#ffd95e',
  gr:'#3fa34d',grD:'#2a7a35',grL:'#8fdc72',bl:'#2d5f9a',
  br:'#8a5a2b',brD:'#5e3a1a',brL:'#c08549',
  gy:'#8b95a3',gyD:'#5b6472',gyL:'#c8cfd8',ru:'#b0603a',
  pu:'#8a52d1',puD:'#5a2f99',puL:'#b58bf0',st:'#a8a0b8',stD:'#77708a',stL:'#cfc8dc',
  te:'#22a197',teD:'#126a63',teL:'#7fe0d6',tg:'#e6fffb',mo:'#6b5a6e',moL:'#9c8aa0',ps:'#f0a0a8'};

/** Paleta base dos personagens 64×80 (cada visual pode sobrescrever). */
export const CHARACTER_PALETTE={R:'#5a3418',S:'#f2be8f',I:'#7a4a22',E:'#24150d',W:'#ffffff',p:'#ef8f7c',t:'#9a4a2e',F:'#d33f2f',C:'#efe4c8',
  G:'#9a6233',h:'#c08549',g:'#6a3f1f',B:'#5e3b1f',Y:'#f0c24f',P:'#6e7a3e',K:'#7a4a26',u:'#c9a06a',D:'#5a3a24',n:'#4a2d16',
  k:'#d8ab4c',L:'#8fd0ea',H:'#2b2b3a',bl:'#5d7fa8',rd:'#d33f2f',gm:'#3fbf9a',Fe:'#f4efe2'};

/** Paleta dos objetos do mapa. */
export const PROP_PALETTE={lf:'#3f8a3a',lf2:'#2c6a33',lf3:'#58a045',tr:'#6b4a2b',tr2:'#4a3020',rk:'#80776c',rkb:'#6a7a84',ou:'#f0c24f',wd:'#9a6b3a',wd2:'#6e4828',
  th:'#c9a35a',rf:'#a8432e',st:'#b0aac6',stp:'#8a52d1',cr:'#7fe0d6',crp:'#b58bf0',crg:'#9be27a',dk:'#100c10',mt:'#6b7280',fr:'#d9442e',cn:'#efe4c8',
  lam:'#ffd95e',jn:'#2b3d52',sw:'#3f8a5a',mo:'#5f8a46'};

/** Tons de chão por bioma (4 tons cada, em RGB). */
export const GROUND_PALETTE = {};
const gp = (k, a) => (GROUND_PALETTE[k] = a.map(hexToRgb));
gp('porto',['#6c9438','#7aa443','#89b44d','#9dc45b']);gp('selva',['#2b5a29','#356a30','#417b37','#518f40']);
gp('praia',['#d6b276','#e2c287','#ecd096','#f5dfad']);gp('molhada',['#b89a64','#c4a670','#cfb27c','#d9bd88']);
gp('minas',['#6a6158','#776e64','#857b70','#958b7e']);gp('templo',['#857f9c','#958fad','#a7a1bf','#bbb6d1']);
gp('agua',['#174a73','#1b5683','#216391','#2a729f']);gp('raso',['#3a93b8','#45a1c4','#53aecd','#68bfd9']);
gp('pier',['#6e4828','#7d5431','#8e613a','#9e6f45']);gp('cobble',['#7c6e5c','#8e806b','#a1937d','#b5a790']);
gp('trilha',['#6f5236','#7d5e3f','#8b6a49','#9a7755']);gp('cascalho',['#8a7f72','#988d7f','#a69b8c','#b5aa9b']);
gp('laje',['#a39eb8','#b2adc6','#c1bcd4','#d0cbe1']);
gp('c_mare',['#2a3a44','#34474f','#3f535b','#4b6068']);gp('c_raiz',['#3a3022','#46392a','#524333','#5f4e3c']);
gp('c_mina',['#3d322a','#4a3d33','#57483c','#655446']);gp('c_cripta',['#352c40','#40364c','#4c4158','#594d66']);
gp('w_mare',['#141c22','#1d272e','#28343c','#36454e']);gp('w_raiz',['#1a140e','#251d15','#32281d','#413426']);
gp('w_mina',['#1b1510','#261e17','#33291f','#43362a']);gp('w_cripta',['#18131e','#221b2a','#2e2538','#3c3148']);

export const FLOWERS = ['#f4d35e', '#ee6c4d', '#f7f0e1', '#e58fb4', '#9ad1ff'].map(hexToRgb);
