/* Geração procedural das cavernas (autômato celular + corredor até a entrada). */
import { TILE as T } from '../config/constants.js';
import { N4, clamp } from '../core/math.js';
import { mulberry32 } from '../core/random.js';
import { CAVES, CAVE_CRYSTAL_COLOR } from '../data/world.js';
import { fbm } from '../core/noise.js';
import { reachOf } from './pathfinding.js';
import { addProp, block, walkOn } from './tiles.js';

/** Gera o mapa de uma caverna a partir da sua configuração em CAVES. */
export function generateCave(id){
  const cfg=CAVES[id],W=30,H=22,rnd=mulberry32(cfg.seed);
  const ex=W>>1,ey=H-2;let g,tries=0;
  for(;;){tries++;
    g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x<2||y<2||x>W-3||y>H-3?1:rnd()<.46?1:0));
    for(let it=0;it<5;it++){const c=g.map(r=>r.slice());
      for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){let w=0;for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++)w+=c[y+j][x+k];g[y][x]=w>=5?1:0}}
    // maior região de chão
    const lab=Array.from({length:H},()=>Array(W).fill(-1));let best=-1,bestN=0,cells=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]&&lab[y][x]<0){const id=cells.length,q=[[x,y]],list=[];lab[y][x]=id;
      while(q.length){const[a,b]=q.pop();list.push([a,b]);for(const[dx,dy]of N4){const X=a+dx,Y=b+dy;if(!g[Y]?.[X]&&g[Y]?.[X]!==undefined&&lab[Y][X]<0){lab[Y][X]=id;q.push([X,Y])}}}
      cells.push(list);if(list.length>bestN){bestN=list.length;best=id}}
    if(bestN<150&&tries<20)continue;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]&&lab[y][x]!==best)g[y][x]=1;
    // corredor da entrada até a região principal
    let x=ex,y=ey;g[ey][ex]=0;
    const tgt=cells[best].reduce((p,c)=>Math.hypot(c[0]-ex,c[1]-ey)<Math.hypot(p[0]-ex,p[1]-ey)?c:p);
    for(let k=0;k<200&&lab[y][x]!==best;k++){const dx=tgt[0]-x,dy=tgt[1]-y;
      if(dy!==0&&(dx===0||rnd()<.6))y+=Math.sign(dy);else x+=Math.sign(dx);g[y][x]=0;if(rnd()<.3)g[y][clamp(x+1,2,W-3)]=0}
    g[ey-1][ex]=0;
    // a saída fica num beco: só o tile de cima leva para dentro, então nenhum caminho passa por ela
    for(let xx=0;xx<W;xx++)if(xx!==ex)g[ey][xx]=1;
    // se isso cortou a ligação, abre um corredor reto para cima até o salão principal
    for(let yy=ey-1;yy>=2&&lab[yy][ex]!==best;yy--)g[yy][ex]=0;
    break}
  const grid=v=>Array.from({length:H},()=>Array(W).fill(v));
  const m={id,name:cfg.name,W,H,water:false,dark:true,style:cfg.style,bio:grid('parede'),obs:grid(0),reg:grid(cfg.reg),road:grid(0),lock:grid(0),special:grid(0),
    props:[],chests:[],npcs:[],portals:[],secrets:[],start:{x:ex,y:ey-1}};
  for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(!g[yy][xx])m.bio[yy][xx]='chao';
  m.bio[ey][ex]='chao';
  const keepReach=()=>{const r=reachOf(m,ex,ey);for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(m.bio[yy][xx]==='chao'&&!m.obs[yy][xx]&&!r.has(xx+','+yy))m.bio[yy][xx]='parede';return r};
  keepReach();
  const open8=(xx,yy)=>{for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++)if(m.bio[yy+j]?.[xx+k]!=='chao')return false;return true};
  if(cfg.style==='mare')for(let yy=2;yy<H-3;yy++)for(let xx=2;xx<W-2;xx++)if(open8(xx,yy)&&fbm(xx/4,yy/4,cfg.seed)>.62&&Math.hypot(xx-ex,yy-ey)>4)m.bio[yy][xx]='poca';
  for(let yy=2;yy<H-3;yy++)for(let xx=2;xx<W-2;xx++)if(m.bio[yy][xx]==='chao'&&open8(xx,yy)&&rnd()<.06&&Math.hypot(xx-ex,yy-ey)>3)
    block(m,xx,yy,'estalagmite',cfg.style==='raiz'?'raiz':cfg.style==='cripta'?'pilar_q':cfg.style==='mina'&&rnd()<.5?'escora':'estalagmite');
  const reach=keepReach();
  // cristais nas paredes
  for(let yy=1;yy<H-1;yy++)for(let xx=1;xx<W-1;xx++)if(m.bio[yy][xx]==='chao'&&!m.obs[yy][xx]&&m.bio[yy-1][xx]==='parede'&&rnd()<.12&&Math.hypot(xx-ex,yy-ey)>2){
    const col=CAVE_CRYSTAL_COLOR[cfg.style];
    addProp(m,cfg.style==='mina'?'lanterna':'cristal_'+cfg.style,xx,yy,{py:yy*T+14,shadow:0,glow:col})}
  // baús nos pontos mais distantes
  const dist={};const q=[[ex,ey]];dist[ex+','+ey]=0;
  while(q.length){const[a,b]=q.shift();for(const[dx,dy]of N4){const X=a+dx,Y=b+dy,k=X+','+Y;if(dist[k]===undefined&&walkOn(m,X,Y)){dist[k]=dist[a+','+b]+1;q.push([X,Y])}}}
  const cells=Object.entries(dist).map(([k,d])=>[...k.split(',').map(Number),d]).filter(([a,b])=>!m.props.some(p=>p.tx===a&&p.ty===b));
  const chosen=[];
  for(let i=0;i<cfg.chests+(cfg.npc?1:0);i++){let best=null,bv=-1;
    for(const[a,b,d]of cells){const md=Math.min(d,...chosen.map(([c,e])=>Math.abs(c-a)+Math.abs(e-b)*1.0));if(md>bv){bv=md;best=[a,b]}}
    if(best)chosen.push(best)}
  chosen.slice(0,cfg.chests).forEach(([a,b],i)=>m.chests.push({id:id+':'+i,x:a,y:b,reg:cfg.reg,boost:cfg.boost,special:1,place:cfg.name}));
  if(cfg.npc&&chosen[cfg.chests]){const[a,b]=chosen[cfg.chests];m.npcs.push({x:a,y:b,...cfg.npc,nid:'c_'+id,reg:cfg.reg,still:true})}
  m.portals.push({x:ex,y:ey,to:'ilha',back:null});
  addProp(m,'tocha',ex-1,ey-1,{py:(ey-1)*T+20,shadow:0,glow:'#ffb347'});
  m.reach=reach;
  return m;
}
