/*
 * Pintura do chão de um mapa inteiro (biomas, estradas, espuma, cavernas e sombras).
 * O cálculo dos pixels (computeGround) é puro e pode rodar num Web Worker (groundWorker.js);
 * a thread principal só monta o canvas e desenha as sombras (toCanvas).
 */
import { TILE as T } from '../config/constants.js';
import { clamp } from '../core/math.js';
import { fbm, h2, vnoise } from '../core/noise.js';
import { isWatery } from '../world/tiles.js';
import { FLOWERS, GROUND_PALETTE as GP } from './palettes.js';
import { SHADOW_W } from './props.js';

/**
 * Mar com profundidade (distorcida) acima disto fica transparente: lá a cor seria a mesma do mar
 * animado do fundo. Tiles a DEEP_SKIP+ da terra nem são calculados (a distorção muda no máximo 1).
 */
const DEEP_SEA = 6, DEEP_SKIP = DEEP_SEA + 2;

const pickc=(p,vv)=>p[clamp((vv*4)|0,0,3)];
const WET_PROBE=[[7,0],[-7,0],[0,7],[0,-7]],FOAM_PROBE=[[4,0],[-4,0],[0,4],[0,-4]],POOL_PROBE=[[3,0],[-3,0],[0,3],[0,-3]];

/**
 * Pixels RGBA do chão de `m` (sem sombras). Usa só os campos W, H, bio, road, reg, special,
 * depth, dark, style e water, então funciona fora da thread principal.
 */
export function computeGround(m){
  const Wp=m.W*T,Hp=m.H*T,d=new Uint8ClampedArray(Wp*Hp*4);
  const bioAt=(px,py)=>m.bio[clamp((py/T)|0,0,m.H-1)][clamp((px/T)|0,0,m.W-1)];
  const roadAt=(px,py)=>m.road[clamp((py/T)|0,0,m.H-1)][clamp((px/T)|0,0,m.W-1)];
  const st=m.style,BW=(Wp>>2)+1,BH=(Hp>>2)+1,WX=new Float32Array(BW*BH),WY=new Float32Array(BW*BH),NW=(Wp>>1)+1,NF=new Float32Array(NW*((Hp>>1)+1));
  for(let by=0;by<BH;by++)for(let bx=0;bx<BW;bx++){WX[by*BW+bx]=vnoise(bx*4/19,by*4/19,3)-.5;WY[by*BW+bx]=vnoise(bx*4/19,by*4/19,4)-.5}
  for(let ny=0;ny<=(Hp>>1);ny++)for(let nx=0;nx<NW;nx++)NF[ny*NW+nx]=fbm(nx*2/42,ny*2/42,5,2);
  // manchas grandes da selva e do templo: ruído em meia resolução, só se o bioma existir no mapa
  const has=k=>m.bio.some(r=>r.includes(k));
  const half=(scale,seed)=>{const a=new Float32Array(NF.length);for(let ny=0;ny<=(Hp>>1);ny++)for(let nx=0;nx<NW;nx++)a[ny*NW+nx]=fbm(nx*2/scale,ny*2/scale,seed);return a};
  const SELVA=has('selva')?half(9,12):null,TEMPLO=has('templo')?half(16,19):null;
  const depthAt=(px,py)=>m.depth?m.depth[clamp((py/T)|0,0,m.H-1)][clamp((px/T)|0,0,m.W-1)]:0;
  const paintRow=py=>{const ty=(py/T)|0,ly=py-ty*T;
    for(let px=0;px<Wp;px++){const tx=(px/T)|0,lx=px-tx*T,b0=m.bio[ty][tx];
      if(m.water&&m.depth&&m.depth[ty][tx]>=DEEP_SKIP)continue; // transparente (alfa 0)
      const bi=(py>>2)*BW+(px>>2),wx=WX[bi],wy=WY[bi];
      let b=b0;
      if(!m.dark&&b0!=='pier'){b=bioAt(px+wx*16,py+wy*16);if(b==='pier')b=b0;if(isWatery(b)!==isWatery(b0))b=bioAt(px+wx*11,py+wy*11);if(b==='pier')b=b0}
      const n=NF[(py>>1)*NW+(px>>1)],gr=h2(px,py,1);let v=n*.72+gr*.28,c;
      if(m.dark){
        if(b0==='parede'){const below=ty+1<m.H&&m.bio[ty+1][tx]!=='parede';
          if(below&&ly>=10){const strata=((ly+((h2(tx,(px>>2),5)*4)|0))>>2)&1;c=GP['w_'+st][ly>28?0:strata?3:2]}
          else c=pickc(GP['w_'+st],v*.6)}
        else if((()=>{if(b0==='parede')return false;const bw=bioAt(px+wx*14,py+wy*14);b=bw==='parede'?b0:bw;return b==='poca'})()){
          let edge=false;for(const[ox,oy]of POOL_PROBE){const q=bioAt(px+ox+wx*14,py+oy+wy*14);if(q!=='poca'&&q!=='parede'){edge=true;break}}
          c=edge?GP.raso[1]:GP.agua[(n*2)|0];if(!edge&&h2(px>>2,py,9)>.97)c=GP.raso[3]}
        else{c=pickc(GP['c_'+st],v);
          if(st==='cripta'&&(((px+(((py>>4)&1)*8))%16===0)||py%16===0))c=GP['c_cripta'][0];
          if(st==='raiz'&&fbm(px/14,py/14,8)>.66)c=[54,74,38];
          const up=ty>0&&m.bio[ty-1][tx]==='parede';if(up&&ly<7)c=GP['c_'+st][0];
          if(h2(px>>1,py>>1,13)>.985)c=GP['c_'+st][3]}
      }else{
        const road=b0!=='pier'&&!isWatery(b0)&&roadAt(px+wx*5,py+wy*5)&&!isWatery(b);
        if(b==='agua'){const dp=depthAt(px+wx*20,py+wy*20);if(m.water&&dp>DEEP_SEA)continue;c=GP.agua[dp<=1?3:dp<=3?2:dp<=6?1:0];
          if(((py+((vnoise(px/30,py/30,6)*10)|0))%13===0)&&h2(px>>3,py,2)>.55)c=GP.raso[1]}
        else if(b==='raso'){c=pickc(GP.raso,v);if(((py+((vnoise(px/26,py/26,6)*8)|0))%11===0)&&h2(px>>3,py,2)>.6)c=GP.raso[3]}
        else if(b==='pier'){const plank=(py%8===0)||(lx<3||lx>28);c=plank?GP.pier[0]:GP.pier[1+((h2(tx,py>>3,4)*3)|0)];if(!plank&&py%8===4&&(lx===6||lx===25))c=[60,40,24]}
        else if(road){const reg=m.reg[ty][tx];
          if(reg==='porto'){const row=(py/6)|0,off=(row&1)*4,col=((px+off)/8)|0,ex=(px+off)%8===0||py%6===0;c=ex?GP.cobble[0]:GP.cobble[1+((h2(col,row,6)*3)|0)]}
          else if(reg==='templo'){const ex=px%16===0||py%16===0;c=ex?GP.laje[0]:pickc(GP.laje,.4+v*.5)}
          else if(reg==='minas'){c=pickc(GP.cascalho,v);if(h2(px>>1,py>>1,3)>.9)c=GP.cascalho[0]}
          else{c=pickc(GP.trilha,v);if(h2(px>>1,py>>1,3)>.93)c=GP.trilha[3]}}
        else if(b==='praia'){let wet=false;for(const[ox,oy]of WET_PROBE)if(isWatery(bioAt(px+ox,py+oy))){wet=true;break}
          c=pickc(wet?GP.molhada:GP.praia,v);if(h2(px>>1,py>>1,21)>.993)c=[247,220,214]}
        else if(b==='porto'){c=pickc(GP.porto,v);
          const cx2=(px/10)|0,cy2=(py/10)|0,hh=h2(cx2,cy2,7),fx=cx2*10+3+((h2(cx2,cy2,8)*4)|0),fy=cy2*10+3+((h2(cx2,cy2,9)*4)|0);
          if(hh>.965&&Math.abs(px-fx)<=1&&Math.abs(py-fy)<=1)c=Math.abs(px-fx)+Math.abs(py-fy)===0?[255,240,170]:FLOWERS[(hh*1000|0)%5];
          else if(hh<.12&&(px===fx||px===fx+2)&&py>=fy&&py<=fy+2)c=GP.porto[0]}
        else if(b==='selva'){c=pickc(GP.selva,v);if(SELVA[(py>>1)*NW+(px>>1)]>.64)c=GP.selva[0];
          const cx2=(px/12)|0,cy2=(py/12)|0,hh=h2(cx2,cy2,17),fx=cx2*12+4,fy=cy2*12+4;
          if(hh>.975&&px>=fx&&px<=fx+3&&py>=fy&&py<=fy+1)c=[214,64,52];else if(hh>.975&&px>=fx+1&&px<=fx+2&&py>=fy+2&&py<=fy+3)c=[236,226,200]}
        else if(b==='minas'){c=pickc(GP.minas,v);if(Math.abs(vnoise(px/11,py/11,14)-.5)<.018)c=GP.minas[0];if(h2(px>>1,py>>1,15)>.992)c=[240,194,79]}
        else if(b==='templo'){const ex=((px+(((py>>4)&1)*8))%16===0)||py%16===0;c=ex?GP.templo[0]:pickc(GP.templo,.35+v*.55);
          if(TEMPLO[(py>>1)*NW+(px>>1)]>.63&&!ex)c=[98,140,80]}
        else c=[255,0,255];
        if(m.special&&m.special[ty][tx]&&b!=='agua'){const hh=h2(px>>2,py>>2,31);if(hh>.86)c=FLOWERS[(hh*100|0)%5]}
        // espuma na beira da água
        if(isWatery(b)&&(!m.depth||m.depth[ty][tx]<=1)){for(const[ox,oy]of FOAM_PROBE){const nb=bioAt(px+ox,py+oy);if(!isWatery(nb)&&nb!=='pier'){if(vnoise(px/5,py/5,22)>.35)c=[226,244,246];break}}}
      }
      const i=(py*Wp+px)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255;
    }};
  for(let py=0;py<Hp;py++)paintRow(py);
  return d;
}

/** Monta o canvas a partir dos pixels e desenha as sombras dos objetos. */
export function toCanvas(m,data){
  const Wp=m.W*T,Hp=m.H*T,cv=document.createElement('canvas');cv.width=Wp;cv.height=Hp;
  const ctx=cv.getContext('2d');
  ctx.putImageData(new ImageData(data,Wp,Hp),0,0);
  ctx.fillStyle=m.dark?'rgba(0,0,0,.35)':'rgba(12,28,16,.28)';
  for(const p of m.props){if(!p.shadow)continue;const w=SHADOW_W[p.k]||22;ctx.beginPath();ctx.ellipse(p.px+3,p.py-2,w/2,w/5,0,0,Math.PI*2);ctx.fill()}
  return cv;
}

/** Campos do mapa que o worker precisa (o resto fica na thread principal). */
const groundFields=m=>({W:m.W,H:m.H,bio:m.bio,road:m.road,reg:m.reg,special:m.special,depth:m.depth,dark:m.dark,style:m.style,water:m.water});

let worker=null,nextJob=0;
const pending=new Map();
function getWorker(){
  if(worker||typeof Worker==='undefined')return worker;
  try{
    worker=new Worker(new URL('./groundWorker.js',import.meta.url),{type:'module'});
    worker.onmessage=e=>{const job=pending.get(e.data.id);if(job){pending.delete(e.data.id);job(e.data.data)}};
  }catch{worker=null}
  return worker;
}

/** Pinta o mapa agora (bloqueia). Usado quando a pintura em segundo plano não ficou pronta. */
export function paintMap(m){
  if(!m.canvas){m.canvas=toCanvas(m,computeGround(m));m.paintPromise=null}
  return m.canvas;
}

/** Pinta em segundo plano (Web Worker). Devolve uma Promise do canvas; repetir a chamada reaproveita. */
export function paintMapAsync(m){
  if(m.canvas)return Promise.resolve(m.canvas);
  if(m.paintPromise)return m.paintPromise;
  const w=getWorker();
  if(!w)return Promise.resolve(paintMap(m));
  const id=++nextJob;
  const promise=m.paintPromise=new Promise(resolve=>{
    pending.set(id,data=>{
      if(m.paintPromise!==promise)return; // descartado enquanto pintava
      m.canvas=toCanvas(m,data);m.paintPromise=null;resolve(m.canvas);
    });
  });
  w.postMessage({id,map:groundFields(m)});
  return promise;
}

/** Descarta a pintura (pronta ou em andamento) para liberar memória. */
export function releasePaint(m){m.canvas=null;m.paintPromise=null}
