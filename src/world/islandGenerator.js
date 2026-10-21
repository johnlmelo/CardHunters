/* Geração procedural da ilha: biomas, píer, estradas, vila, cavernas, segredos, vegetação, baús e duelistas. */
import { TILE as T } from '../config/constants.js';
import { N4 } from '../core/math.js';
import { mulberry32 } from '../core/random.js';
import { GUARDIAN_NAMES, ISLAND_CHESTS, REGION_DUELISTS, REGION_TYPE } from '../data/world.js';
import { fbm, h2, hash } from '../core/noise.js';
import { cheapPath, reachOf } from './pathfinding.js';
import { BLOCK_BIO, FAKE, addProp, block, tileFree, walkOn } from './tiles.js';

const ISLAND_SEED = 20261017;

/** Gera o mapa da ilha (sempre o mesmo, pela semente fixa). */
export function generateIsland(){
  const W=60,H=46,rnd=mulberry32(ISLAND_SEED),cx=W/2,cy=H/2;
  const grid=v=>Array.from({length:H},()=>Array(W).fill(v));
  const m={id:'ilha',name:'Ilha da Cobiça',W,H,water:true,dark:false,bio:grid(''),obs:grid(0),reg:grid(''),road:grid(0),lock:grid(0),special:grid(0),
    props:[],chests:[],npcs:[],portals:[],secrets:[]};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const nx=(x+.5-cx)/(W/2),ny=(y+.5-cy)/(H/2),d=Math.hypot(nx,ny),ang=Math.atan2(ny,nx);
    const edge=.86+.07*Math.sin(ang*5+1)+.04*Math.sin(ang*11+2)+(hash(x,y)-.5)*.04;
    let deg=(ang*180/Math.PI+360)%360;deg=(deg+(Math.sin(d*9+ang*3)*14)+360)%360;
    const sector=deg>=45&&deg<150?'porto':deg>=150&&deg<270?'selva':'minas';
    let b;if(d>edge+.07)b='agua';else if(d>edge)b='raso';else if(d>edge-.08)b='praia';else if(d<.24)b='templo';else b=sector;
    m.bio[y][x]=b;m.reg[y][x]=b==='templo'?'templo':sector;
  }
  // píer de chegada
  const sx=Math.floor(cx);let sy=H-1;while(sy>0&&m.bio[sy][sx]!=='praia')sy--;
  let py=sy+1,len=0;while(py<H-1&&len<5&&BLOCK_BIO[m.bio[py][sx]]){m.bio[py][sx]='pier';m.reg[py][sx]='porto';py++;len++}
  m.start={x:sx,y:Math.max(sy,py-1)};
  addProp(m,'barco',sx+1,py-1,{px:(sx+1)*T+30,py:(py-1)*T+30,shadow:0});
  for(let y=sy-1;y<=m.start.y;y++)for(let x=sx-2;x<=sx+2;x++)if(m.lock[y])m.lock[y][x]=1;
  // estradas: píer → templo → selva e minas
  const land=(x,y)=>!BLOCK_BIO[m.bio[y][x]];
  const centroid=reg=>{let X=0,Y=0,n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m.reg[y][x]===reg&&m.bio[y][x]===reg){X+=x;Y+=y;n++}return[Math.round(X/n),Math.round(Y/n)]};
  const hub=[cx,cy],pS=centroid('selva'),pM=centroid('minas'),pP=centroid('porto');
  const mark=path=>path.forEach(([x,y])=>{if(m.bio[y][x]!=='pier')m.road[y][x]=1});
  mark(cheapPath(m,sx,sy,hub[0],hub[1]+4,land));
  mark(cheapPath(m,hub[0],hub[1]+4,pS[0],pS[1],land));
  mark(cheapPath(m,hub[0],hub[1]+4,pM[0],pM[1],land));
  mark(cheapPath(m,sx,sy-2,pP[0],pP[1],land));
  // vila do porto: casas, poço, postes, barris
  const nearStart=(x,y,a,b)=>{const d=Math.hypot(x-sx,y-sy);return d>=a&&d<=b};
  let huts=0;
  for(let t=0;t<900&&huts<3;t++){
    const x0=sx-12+Math.floor(rnd()*24),y0=sy-11+Math.floor(rnd()*9);
    if(!nearStart(x0+1,y0+1,3,13))continue;let ok=true;
    for(let y=y0-1;y<=y0+2&&ok;y++)for(let x=x0-1;x<=x0+3&&ok;x++){if(!m.reg[y]||m.reg[y][x]!=='porto'||!tileFree(m,x,y))ok=false}
    if(!ok)continue;
    for(let y=y0;y<y0+2;y++)for(let x=x0;x<x0+3;x++)m.obs[y][x]='casa';
    addProp(m,'casa',x0+1,y0+1,{px:(x0+1.5)*T,py:(y0+2)*T});
    for(let x=x0-1;x<=x0+3;x++)m.lock[y0+2][x]=1;
    if(rnd()<.8&&tileFree(m,x0+3,y0+1))block(m,x0+3,y0+1,'barril',rnd()<.5?'barril':'caixote');
    huts++;
  }
  // postes ao longo da estrada perto do porto
  let posts=0;for(let y=0;y<H&&posts<6;y++)for(let x=0;x<W&&posts<6;x++){if(m.road[y][x]&&m.reg[y][x]==='porto'&&nearStart(x,y,2,16)&&h2(x,y,3)>.8){
    const s=tileFree(m,x+1,y)?x+1:tileFree(m,x-1,y)?x-1:null;if(s!==null){block(m,s,y,'poste','poste',{glow:'#ffd95e'});posts++}}}
  for(let t=0;t<200;t++){const x=sx-6+Math.floor(rnd()*12),y=sy-8+Math.floor(rnd()*6);if(tileFree(m,x,y)&&m.reg[y][x]==='porto'&&nearStart(x,y,4,9)){block(m,x,y,'poco','poco');break}}
  // naufrágio na praia
  for(let t=0;t<600;t++){const x=2+Math.floor(rnd()*(W-6)),y=2+Math.floor(rnd()*(H-4));
    if([0,1,2].every(i=>tileFree(m,x+i,y)&&m.bio[y][x+i]==='praia')&&Math.hypot(x-sx,y-sy)>12){[0,1,2].forEach(i=>m.obs[y][x+i]='naufragio');addProp(m,'naufragio',x+1,y,{py:y*T+30});break}}
  // cavernas (entradas) e segredos são colocados antes da vegetação para terem espaço
  const caveSpots={};
  const placeCave=(reg,style,id,cond)=>{
    for(let t=0;t<3000;t++){const x=2+Math.floor(rnd()*(W-4)),y=2+Math.floor(rnd()*(H-5));
      if((reg!=='porto'&&m.reg[y][x]!==reg)||!cond(x,y))continue;let ok=true;const R=reg==='porto'?1:2;
      for(let yy=y-R;yy<=y+R&&ok;yy++)for(let xx=x-R;xx<=x+R&&ok;xx++)if(!tileFree(m,xx,yy)||(reg!=='porto'&&m.reg[yy][xx]!==reg))ok=false;
      if(ok&&!walkOn(m,x,y+1))ok=false;
      if(!ok||Math.hypot(x-sx,y-sy)<9)continue;
      for(const[dx,dy]of[[-1,0],[1,0],[-1,-1],[0,-1],[1,-1]])m.obs[y+dy][x+dx]='rochedo';
      for(let xx=x-2;xx<=x+2;xx++)for(let yy=y-2;yy<=y+2;yy++)if(m.lock[yy]&&m.lock[yy][xx]!==undefined)m.lock[yy][xx]=1;
      caveSpots[id]={x,y};addProp(m,style==='escada'?'escada':'caverna_'+style,x,y,style==='escada'?{py:(y+1)*T-2,flat:true,shadow:0}:{py:(y+1)*T,shadow:0});
      if(style==='escada'){for(const[dx,dy]of[[-1,0],[1,0],[-1,-1],[0,-1],[1,-1]])m.obs[y+dy][x+dx]=0;block(m,x-1,y,'pilar','pilar');block(m,x+1,y,'pilar','pilar')}
      return true}return false};
  placeCave('porto','mare','gruta',(x,y)=>m.bio[y][x]==='praia'&&Math.abs(x-sx)>8&&m.bio[y-1]&&!BLOCK_BIO[m.bio[y-1][x]]);
  placeCave('selva','raiz','toca',(x,y)=>m.bio[y][x]==='selva');
  placeCave('minas','mina','mina',(x,y)=>m.bio[y][x]==='minas');
  placeCave('templo','escada','cripta',(x,y)=>m.bio[y][x]==='templo'&&Math.hypot(x-cx,y-cy)>2&&y<cy);
  // áreas secretas fechadas por árvores ou rochas, com uma passagem disfarçada
  const ringSecret=(reg,wallK,wallProp,fakeK,id,name)=>{
    for(let t=0;t<4000;t++){const x=4+Math.floor(rnd()*(W-8)),y=4+Math.floor(rnd()*(H-8));let ok=true;
      for(let yy=y-4;yy<=y+4&&ok;yy++)for(let xx=x-4;xx<=x+4&&ok;xx++){if(Math.hypot(xx-x,yy-y)>4.6)continue;if(m.reg[yy][xx]!==reg||m.bio[yy][xx]!==reg||!tileFree(m,xx,yy))ok=false}
      if(!ok||Math.hypot(x-sx,y-sy)<10)continue;
      for(let yy=y-4;yy<=y+4;yy++)for(let xx=x-4;xx<=x+4;xx++){const d=Math.hypot(xx-x,yy-y);m.lock[yy][xx]=1;
        if(d<2.6)m.special[yy][xx]=1;else if(d<3.7)block(m,xx,yy,wallK,wallProp,{})}
      const a=rnd()*Math.PI*2,fx=Math.round(x+Math.cos(a)*3),fy=Math.round(y+Math.sin(a)*3);
      if(m.obs[fy][fx]){m.obs[fy][fx]=fakeK;const p=m.props.find(p=>p.tx===fx&&p.ty===fy&&p.k===wallProp);if(p)p.fake=true}
      m.fakeLink=m.fakeLink||[];m.fakeLink.push({x,y,fx,fy});
      m.secrets.push({id,name,x,y,r:2.6});
      m.chests.push({id:'ilha:'+id,x,y,reg,special:1,boost:40});return}};
  ringSecret('selva','arvore','arvore','arvore_falsa','clareira','Clareira Escondida');
  ringSecret('minas','rocha','rocha','rocha_falsa','jardim','Jardim de Pedra');
  // vegetação e pedras
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    if(!tileFree(m,x,y)||Math.hypot(x-sx,y-sy)<4)continue;const b=m.bio[y][x],n=fbm(x/6,y/6,11),r=rnd();
    if(b==='selva'){if((n>.56&&r<.75)||r<.07)block(m,x,y,'arvore',h2(x,y,9)>.55?'arvore2':'arvore')}
    else if(b==='minas'){if((n>.6&&r<.5)||r<.06)block(m,x,y,'rocha',h2(x,y,9)>.7?'rocha_ouro':'rocha')}
    else if(b==='praia'){if(r<.035)block(m,x,y,'palmeira','palmeira')}
    else if(b==='porto'){if(r<.012)block(m,x,y,'arvore','arvore');else if(r<.03)addProp(m,'arbusto',x,y,{shadow:0})}
    else if(b==='templo'){const d=Math.hypot(x-cx,y-cy);if(Math.abs(d-4.2)<.5&&r<.45)block(m,x,y,'pilar',r<.15?'pilar_q':'pilar');else if(r<.02)block(m,x,y,'estatua','estatua')}
  }
  // ligar as passagens disfarçadas ao resto da ilha
  for(const f of(m.fakeLink||[])){const dx=Math.sign(f.fx-f.x),dy=Math.sign(f.fy-f.y);let x=f.fx,y=f.fy;
    for(let i=0;i<6;i++){x+=dx||0;y+=dy||0;if(!m.obs[y]||m.obs[y][x]===undefined)break;if(m.obs[y][x]&&!FAKE[m.obs[y][x]]){m.obs[y][x]=0;m.props=m.props.filter(p=>!(p.tx===x&&p.ty===y))}
      if(!dx&&!dy)break}}
  const reach=reachOf(m,m.start.x,m.start.y);
  m.reach=reach;
  // portais das cavernas
  for(const[id,p]of Object.entries(caveSpots))m.portals.push({x:p.x,y:p.y,to:id,ax:null,ay:null,back:{x:p.x,y:p.y+1}});
  // baús e duelistas
  const tiles=[...reach].map(s=>s.split(',').map(Number)).filter(([x,y])=>Math.hypot(x-m.start.x,y-m.start.y)>5&&!m.special[y][x]&&!m.road[y][x]&&!m.portals.some(p=>p.x===x&&p.y===y));
  const taken=m.chests.map(c=>[c.x,c.y]).concat(m.portals.map(p=>[p.x,p.y]));
  const pickTiles=(reg,n,minD)=>{const pool=tiles.filter(([x,y])=>m.reg[y][x]===reg);const out=[];let g=0;
    while(out.length<n&&g++<3000){const t=pool[Math.floor(rnd()*pool.length)];if(t&&taken.every(o=>Math.hypot(o[0]-t[0],o[1]-t[1])>=minD)){out.push(t);taken.push(t)}}return out};
  let cid=0;
  for(const[reg,n]of ISLAND_CHESTS)for(const[x,y]of pickTiles(reg,n,6))m.chests.push({id:'ilha:'+(cid++),x,y,reg});
  for(const reg of['porto','selva','minas','templo']){
    const[g1]=pickTiles(reg,1,4);if(g1)m.npcs.push({x:g1[0],y:g1[1],type:REGION_TYPE[reg],name:GUARDIAN_NAMES[reg],guardian:true,nid:'g_'+reg,look:'g_'+reg,reg});
    if(reg!=='templo')pickTiles(reg,2,4).forEach(([x,y],i)=>m.npcs.push({x,y,type:REGION_TYPE[reg],name:REGION_DUELISTS[reg][i],guardian:false,nid:'n_'+reg+i,look:REGION_TYPE[reg],reg}));
  }
  const nreg=['selva','minas','porto'][Math.floor(rnd()*3)],nt=pickTiles(nreg,1,4)[0];
  if(nt)m.npcs.push({x:nt[0],y:nt[1],type:'inveja',name:'Ninguém',guardian:true,nid:'g_ninguem',look:'g_ninguem',reg:nreg});
  // distância até a terra (profundidade da água)
  m.depth=grid(0);const q=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!BLOCK_BIO[m.bio[y][x]]){m.depth[y][x]=0;q.push([x,y])}else m.depth[y][x]=99}
  while(q.length){const[x,y]=q.shift();for(const[dx,dy]of N4){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&m.depth[Y][X]>m.depth[y][x]+1){m.depth[Y][X]=m.depth[y][x]+1;q.push([X,Y])}}}
  m.caveSpots=caveSpots;
  return m;
}
