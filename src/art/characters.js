/*
 * Personagens em pixel art 64×80. Cada personagem é montado com formas (elipses, cápsulas
 * e polígonos) que recebem sombreamento de volume em 4 tons, contorno colorido e detalhes
 * pintados à mão por cima. Vistas: frente, costas e perfil; 3 fases de passo cada.
 */
import { CHARACTER_PALETTE as C64 } from './palettes.js';
import { render64 } from './shapeRenderer.js';

/** Visuais disponíveis (herói, duelistas por tipo e guardiões). */
export const LOOKS = {
  hero:{head:'goggles',pack:true},
  ouro:{head:'tricorne',stubble:true,pal:{C:'#b83a2e',F:'#f4efe2',B:'#3a2a1e',P:'#3a3a4a',R:'#1b1420',K:'#2b1d14',H:'#2b2b3a',D:'#3a2a1e',G:'#5a3a24',I:'#3a2a1e'}},
  g_porto:{head:'tricorne',long:true,coat:true,feather:true,pal:{C:'#1f3a6b',F:'#f0c24f',H:'#7a1f2b',B:'#f0c24f',R:'#c4481f',P:'#f4efe2',K:'#2b1d14',I:'#2a7a4a',D:'#f4efe2',G:'#7a1f2b'}},
  fome:{head:'straw',pack:true,pal:{H:'#e0be6a',B:'#3f9b4c',C:'#6a9a2e',F:'#e98a2b',S:'#c98a5a',R:'#2a1a0c',G:'#4f7d2a',h:'#6f9e3e',g:'#35571b',P:'#5a4a2a',bl:'#b5651a'}},
  g_selva:{head:'straw',grin:true,coat:true,pal:{H:'#3f9b4c',B:'#e98a2b',C:'#2f6b2a',F:'#e98a2b',S:'#a8714a',R:'#2a1a0c',G:'#4f7d2a',P:'#5a4a2a',I:'#2f6b2a',Fe:'#c6f1a0'}},
  ferro:{head:'helmet',pack:true,stubble:true,pal:{H:'#e0b02a',C:'#6b7280',F:'#8a5a2b',P:'#3b3f48',R:'#4a4a4a',S:'#e8b48a',G:'#7a5a3a',bl:'#4b5563'}},
  g_minas:{head:'crown',long:true,coat:true,pal:{C:'#3b4250',F:'#c0c6cf',R:'#d8dde6',P:'#262b35',B:'#f0c24f',I:'#5a6a8a',G:'#3b4250',Fe:'#c0c6cf',D:'#c0c6cf'}},
  poder:{head:'mitre',coat:true,pal:{H:'#f4efe2',C:'#5b2c99',F:'#f0c24f',R:'#e8e0f0',P:'#2b1f3a',B:'#f0c24f',I:'#5b2c99',G:'#5b2c99',Fe:'#f4efe2',D:'#f4efe2'}},
  g_templo:{head:'crown',coat:true,voidFace:true,pal:{C:'#3f1d6e',F:'#f0c24f',S:'#2b1f3a',R:'#2b1f3a',P:'#2b1f3a',I:'#ffd95e',B:'#f0c24f',G:'#3f1d6e',Fe:'#f0c24f',D:'#2b1f3a'}},
  g_ninguem:{head:'hood',voidFace:true,coat:true,pal:{H:'#0f2f2c',S:'#081c1a',C:'#14403c',F:'#22a197',P:'#0b2b28',K:'#06100f',D:'#0f2f2c',B:'#081f1d',I:'#9ff5ea',G:'#14403c',u:'#14403c',Fe:'#22a197'}}
};

/** Matriz de cores de um personagem numa vista ('front' | 'back' | 'side') e fase de passo (0, 1, -1). */
export function buildCharacter(look,view,ph){
  const sh=[],dt=[];let oy=0,tx=x=>x,tw=w=>w;
  const E=(cx,cy,rx,ry,k,o={})=>sh.push({t:'e',cx:tx(cx),cy:cy+oy,rx:tw(rx),ry,k,...o});
  const C=(x,y,w,h,k,o={})=>sh.push({t:'c',x:tx(x),y:y+oy,w:tw(w),h,k,r:o.r??Math.min(3,w/2,h/2),...o});
  const P=(pts,k,o={})=>sh.push({t:'p',pts:pts.map(([x,y])=>[tx(x),y+oy]),k,...o});
  const F=(x,y,w,h,k,t=2)=>dt.push({x:Math.round(tx(x)),y:y+oy,w:Math.max(1,Math.round(tw(w))),h,k,t});
  const b=ph?1:0,ft=ph?2:0,hood=look.head==='hood';
  const boot=(x,y,dim=0)=>{C(x,y,11,9,'K',{r:3,dim});C(x,y,11,3,'u',{r:1,dim});E(x+5.5,y+8,6.5,2.5,'K',{dim});if(!dim)F(x+3,y+4,5,1,'u',1)};
  const bootS=(x,y,dim=0)=>{C(x,y,10,9,'K',{r:3,dim});C(x,y,10,3,'u',{r:1,dim});E(x+8,y+7.5,5,2.5,'K',{dim})};
  const arm=(x,dy)=>{C(x,36+dy,8,12,'C',{r:3});C(x,45+dy,8,3,'C',{tone:3,r:1});C(x+1,47+dy,6,5,'S',{r:2});C(x,51+dy,8,3,'D',{r:1});E(x+4,56+dy,4.5,4,'D')};
  const hat=view=>{const fr=view==='front';
    switch(look.head){
      case 'tricorne':P([[6,13],[12,5],[22,2],[32,1],[42,2],[52,5],[58,13],[46,10],[32,12],[18,10]],'H');C(17,8,30,3,'B',{r:1});
        if(fr)F(30,3,4,4,'Y',3);if(look.feather)P([[44,6],[60,0],[62,4],[48,9]],'Fe');break;
      case 'straw':C(19,1,26,12,'H',{r:6});E(32,13,27,5,'H');C(19,9,26,3,'B',{r:1});F(22,4,20,1,'H',1);F(21,7,22,1,'H',1);break;
      case 'helmet':E(32,12,17,11,'H');E(32,16,21,3.5,'H');C(31,1,2,11,'H',{tone:3,r:0});
        if(fr){C(27,4,10,7,'k',{r:2});E(32,7.5,3,3,'L',{line:false});F(31,6,1,1,'#ffffff')}else if(view==='side')C(44,5,6,7,'k',{r:2});break;
      case 'mitre':P([[21,15],[23,4],[32,-2],[41,4],[43,15]],'H');C(21,12,22,3,'Y',{r:1});F(31,1,2,11,'Y',2);if(fr)F(29,5,6,2,'Y',3);break;
      case 'crown':C(19,4,26,8,'Y',{r:1});P([[19,5],[20,-1],[25,5]],'Y');P([[28,5],[32,-2],[36,5]],'Y');P([[39,5],[44,-1],[45,5]],'Y');
        if(fr){F(23,7,3,3,'rd');F(31,7,3,3,'gm');F(39,7,3,3,'rd')}break;
    }};
  const spikesTop=()=>{P([[17,14],[7,9],[19,7]],'R');P([[20,8],[18,0],[27,5]],'R');P([[27,5],[31,-1],[35,5]],'R');P([[34,5],[42,0],[41,8]],'R');P([[42,7],[53,4],[47,13]],'R');P([[46,13],[56,15],[46,18]],'R')};
  if(view==='front'){
    const LL=ph===1?3:0,RL=ph===-1?3:0,la=ph===1?-2:ph===-1?2:0;
    oy=b;if(!hood)P([[22,35],[10,37+ft],[5,45+ft],[12,44+ft],[21,40]],'F');
    oy=0;C(23,55,8,15-LL,'P');C(33,55,8,15-RL,'P');boot(21,68-LL);boot(32,68-RL);
    oy=b;
    if(look.coat){C(17,44,10,17,'C',{r:3});C(37,44,10,17,'C',{r:3})}
    C(21,50,22,8,'P',{r:3});C(19,33,26,20,'C',{r:7});
    if(look.coat&&!look.pack)P([[26,34],[32,45],[38,34]],'Fe');
    C(19,49,26,4,'B',{r:1});F(30,49,4,4,'Y',3);F(31,50,2,2,'B',0);
    C(36,51,8,7,'G',{r:2});F(36,51,8,2,'G',3);F(39,54,2,1,'Y',3);
    if(look.pack){C(23,33,4,17,'G',{r:1});C(37,33,4,17,'G',{r:1});F(23,42,4,2,'Y',3);F(37,42,4,2,'Y',3)}
    else if(!look.coat){F(31,38,2,2,'Y',3);F(31,43,2,2,'Y',3)}
    arm(12,la);arm(44,-la);
    C(28,28,8,7,'S');
    if(hood){E(32,21,20,19,'H');C(11,29,42,11,'H',{r:5});E(32,24,12,11,'S',{line:false});F(31,4,2,10,'H',0)}
    else{
      E(32,34,12,4.5,'F');C(27,36,8,8,'F',{r:3});P([[29,43],[34,43],[33,49],[29,47]],'F');
      E(17.5,22,3,4,'S',{soft:.5});E(46.5,22,3,4,'S',{soft:.5});
      if(look.long){C(12,14,8,27,'R',{r:3});C(44,14,8,27,'R',{r:3})}
      E(32,20,15,14,'S',{soft:.55});
      E(32,11,16,8,'R');spikesTop();
      P([[16,11],[19,18],[24,11]],'R');P([[23,11],[27,17],[31,11]],'R');P([[30,11],[35,16],[38,11]],'R');P([[37,11],[44,18],[48,11]],'R');
      hat('front');
      if(look.head==='goggles'){C(15,10,34,3,'n',{r:1});E(25,11,5.5,5,'k');E(39,11,5.5,5,'k');E(25,11,3.6,3.3,'L',{line:false});E(39,11,3.6,3.3,'L',{line:false});
        F(23,9,2,1,'#ffffff');F(37,9,2,1,'#ffffff');F(31,10,2,2,'k',1)}
    }
    // rosto
    if(look.voidFace){const y=hood?22:20;F(22,y,6,3,'I',3);F(36,y,6,3,'I',3);F(23,y+1,4,1,'#ffffff');F(37,y+1,4,1,'#ffffff')}
    else{
      for(const ex of[22,36]){const ix=ex<30?ex+2:ex+1;F(ex,19,6,7,'#fbf6ee');F(ix,19,3,7,'I',1);F(ix,22,3,4,'I',3);F(ix+1,20,1,4,'E');F(ix,20,1,1,'#ffffff');F(ex,18,6,1,'E');F(ex-1,19,1,1,'E');F(ex+6,19,1,1,'E');F(ex,26,6,1,'S',0)}
      F(22,15,4,1,'R',0);F(26,16,2,1,'R',0);F(36,16,2,1,'R',0);F(38,15,4,1,'R',0);
      F(32,26,1,1,'S',0);F(19,26,4,1,'p');F(41,26,4,1,'p');
      if(look.grin){F(26,28,12,3,'t',1);F(27,28,10,1,'#ffffff')}else{F(29,29,5,1,'t');F(34,28,1,1,'t')}
      if(look.stubble)for(let i=0;i<7;i++)F(25+i*2,31+(i%2),1,1,'R',1);
    }
  }else if(view==='back'){
    const LL=ph===-1?3:0,RL=ph===1?3:0,la=ph===1?2:ph===-1?-2:0;
    oy=0;C(23,55,8,15-LL,'P');C(33,55,8,15-RL,'P');boot(21,68-LL);boot(32,68-RL);
    oy=b;
    if(look.coat){C(17,44,10,17,'C',{r:3});C(37,44,10,17,'C',{r:3})}
    C(21,50,22,8,'P',{r:3});C(19,33,26,20,'C',{r:7});C(19,49,26,4,'B',{r:1});
    arm(12,la);arm(44,-la);
    if(look.pack){C(16,32,32,26,'G',{r:6});C(16,32,32,10,'h',{r:5});C(19,44,10,10,'g',{r:2});C(35,44,10,10,'g',{r:2});
      F(30,40,4,3,'Y',3);F(23,47,3,2,'Y',3);F(38,47,3,2,'Y',3);C(17,27,30,6,'bl',{r:3});F(18,29,28,1,'bl',1)}
    else F(31,36,2,14,'C',0);
    if(hood){E(32,21,20,19,'H');C(11,29,42,13,'H',{r:5});F(31,5,2,28,'H',0)}
    else{
      E(32,33,12,4.5,'F');P([[22,34],[10,37+ft],[5,45+ft],[12,44+ft],[21,39]],'F');
      E(17,22,3,4,'S');E(47,22,3,4,'S');E(32,20,15,14,'S',{soft:.55});
      E(32,17,16,15,'R');C(18,22,28,10,'R',{r:5});spikesTop();
      P([[19,30],[22,36],[25,30]],'R');P([[27,31],[30,37],[33,31]],'R');P([[35,30],[39,36],[42,30]],'R');
      F(24,12,1,14,'R',0);F(32,10,1,16,'R',0);F(40,12,1,14,'R',0);
      if(look.long){C(16,22,32,20,'R',{r:6});F(24,26,1,14,'R',0);F(39,26,1,14,'R',0)}
      hat('back');
      if(look.head==='goggles'){C(15,10,34,3,'n',{r:1});F(30,10,4,3,'k',2)}
    }
  }else{ // perfil, olhando para a direita
    const s=ph*4,sa=-ph*3;
    oy=0;C(27-s,55,8,15,'P',{dim:1});bootS(26-s,68,1);
    oy=b;
    if(look.pack){C(11,33,13,24,'G',{r:4});C(11,33,13,8,'h',{r:3});F(13,45,9,1,'g',2);F(16,40,3,2,'Y',3);C(12,28,12,6,'bl',{r:3})}
    C(25-sa,36,7,12,'C',{dim:1,r:3});C(26-sa,47,6,5,'S',{dim:1});E(29-sa,55,4,4,'D',{dim:1});
    if(look.coat)C(20,44,20,17,'C',{r:4});
    C(22,50,18,8,'P',{r:3});
    oy=0;C(29+s,55,8,15,'P');bootS(28+s,68);oy=b;
    C(21,33,20,20,'C',{r:7});C(21,49,20,4,'B',{r:1});F(37,49,3,4,'Y',3);C(22,51,7,7,'G',{r:2});
    if(look.pack)C(27,33,4,17,'G',{r:1});
    if(look.coat&&!look.pack)F(36,35,3,11,'Fe');
    C(30+sa,36,8,12,'C',{r:3});C(30+sa,45,8,3,'C',{tone:3,r:1});C(31+sa,47,6,5,'S',{r:2});C(30+sa,51,8,3,'D',{r:1});E(34+sa,56,4.5,4,'D');
    C(30,28,8,7,'S');
    if(hood){E(32,21,19,19,'H');C(14,29,34,11,'H',{r:5});E(40,24,9,10,'S',{line:false})}
    else{
      P([[26,33],[12,32+ft],[6,38+ft],[14,39],[26,38]],'F');E(33,34,10,4.5,'F');C(36,36,6,7,'F',{r:2});
      if(look.long)C(15,16,17,25,'R',{r:5});
      E(34,20,14,14,'S',{soft:.55});E(47.5,23,2,2,'S');
      E(27,15,14,13,'R');E(33,9,13,6,'R');
      P([[16,10],[5,6],[15,4]],'R');P([[19,4],[17,-1],[26,2]],'R');P([[26,2],[33,-2],[36,3]],'R');P([[35,3],[44,1],[42,8]],'R');
      P([[14,18],[4,20],[14,23]],'R');P([[14,24],[6,29],[17,28]],'R');
      P([[38,6],[49,11],[45,15],[39,12]],'R');P([[40,10],[46,18],[42,17]],'R');C(30,15,4,8,'R',{r:1});
      E(31,22,3,4,'S',{soft:.5});
      tx=x=>34+(x-32)*.82;tw=w=>w*.82;hat('side');tx=x=>x;tw=w=>w;
      if(look.head==='goggles'){C(19,10,25,3,'n',{r:1});E(42,11,5,5,'k');E(42,11,3.4,3.2,'L',{line:false});F(40,9,2,1,'#ffffff')}
    }
    if(look.voidFace){const y=hood?23:20;F(40,y,6,3,'I',3);F(41,y+1,4,1,'#ffffff')}
    else{
      F(40,19,5,7,'#fbf6ee');F(42,19,3,7,'I',1);F(42,22,3,4,'I',3);F(43,20,1,4,'E');F(42,20,1,1,'#ffffff');F(40,18,6,1,'E');F(40,26,5,1,'S',0);
      F(39,15,6,1,'R',0);F(37,26,4,1,'p');
      if(look.grin){F(41,28,7,2,'t',1);F(42,28,5,1,'#ffffff')}else F(43,29,4,1,'t');
      if(look.stubble)for(let i=0;i<4;i++)F(40+i*2,31+(i%2),1,1,'R',1);
    }
  }
  return render64(sh,dt,{...C64,...(look.pal||{})});
}

export const VIEWS = ['front', 'back', 'side'];
export const STEP_PHASES = [0, 1, -1];

/** Os 9 quadros de um personagem (3 vistas × 3 fases). */
export function characterFrames(name) {
  const look = LOOKS[name], f = [];
  for (const v of VIEWS) for (const ph of STEP_PHASES) f.push(buildCharacter(look, v, ph));
  return f;
}

const PORTRAITS = {};
/** Retrato 48×36 (rosto de frente) como data URL. */
export function portrait(name) {
  if (PORTRAITS[name]) return PORTRAITS[name];
  const a = buildCharacter(LOOKS[name], 'front', 0), c = document.createElement('canvas');
  c.width = 48; c.height = 36;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 36; y++) for (let x = 0; x < 48; x++) { const v = a[y][x + 8]; if (v) { ctx.fillStyle = v; ctx.fillRect(x, y, 1, 1); } }
  return PORTRAITS[name] = c.toDataURL();
}

const FIGURES = {};
/** Corpo inteiro de frente (64×80) como data URL, para as placas do duelo. */
export function figure(name) {
  if (FIGURES[name]) return FIGURES[name];
  const a = buildCharacter(LOOKS[name], 'front', 0), c = document.createElement('canvas');
  c.width = 64; c.height = 80;
  const ctx = c.getContext('2d');
  a.forEach((row, y) => row.forEach((v, x) => { if (v) { ctx.fillStyle = v; ctx.fillRect(x, y, 1, 1); } }));
  return FIGURES[name] = c.toDataURL();
}
