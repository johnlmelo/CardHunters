/*
 * Renderizador de formas em pixel art: elipses ('e'), cápsulas ('c') e polígonos ('p')
 * recebem sombreamento de volume em 4 tons, contorno colorido e detalhes pintados por cima.
 */
import { ramp } from './color.js';

/** Direção da luz. */
const LV=(()=>{const v=[-.47,-.57,.67],m=Math.hypot(...v);return v.map(x=>x/m)})();
/** Ponto dentro do polígono (par-ímpar). */
function pip(x,y,pts){let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)ins=!ins}return ins}
/** Rasteriza as formas e detalhes numa matriz W×HH de cores hex (ou null). */
export function render64(shapes,details,pal,W=64,HH=80){
  const grid=new Array(W*HH).fill(null),col=k=>pal[k]||k;
  shapes.forEach((s,id)=>{
    let x0,y0,x1,y1;
    if(s.t==='e'){x0=s.cx-s.rx;x1=s.cx+s.rx;y0=s.cy-s.ry;y1=s.cy+s.ry}
    else if(s.t==='c'){x0=s.x;y0=s.y;x1=s.x+s.w;y1=s.y+s.h}
    else{const xs=s.pts.map(p=>p[0]),ys=s.pts.map(p=>p[1]);x0=Math.min(...xs);x1=Math.max(...xs);y0=Math.min(...ys);y1=Math.max(...ys)}
    const cx=(x0+x1)/2,cy=(y0+y1)/2,hw=Math.max(.5,(x1-x0)/2),hh=Math.max(.5,(y1-y0)/2);
    for(let y=Math.max(0,Math.floor(y0));y<Math.min(HH,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(W,Math.ceil(x1));x++){
      const px=x+.5,py=y+.5;let nx,ny,inside;
      if(s.t==='e'){nx=(px-s.cx)/s.rx;ny=(py-s.cy)/s.ry;inside=nx*nx+ny*ny<=1}
      else if(s.t==='c'){const r=s.r,qx=Math.max(s.x+r-px,0,px-(s.x+s.w-r)),qy=Math.max(s.y+r-py,0,py-(s.y+s.h-r));
        inside=px>=s.x&&px<=s.x+s.w&&py>=s.y&&py<=s.y+s.h&&qx*qx+qy*qy<=r*r;nx=(px-cx)/hw*.92;ny=(py-cy)/hh*.38}
      else{inside=pip(px,py,s.pts);nx=(px-cx)/hw*.7;ny=(py-cy)/hh*.55}
      if(!inside)continue;
      if(s.soft){nx*=s.soft;ny*=s.soft}
      let tone;
      if(s.tone!==undefined)tone=s.tone;
      else{const d2=Math.min(.98,nx*nx+ny*ny),nz=Math.sqrt(1-d2);let I=nx*LV[0]+ny*LV[1]+nz*LV[2];I+=((x+y)&1)?.02:-.02;tone=I>.74?3:I>.36?2:I>.06?1:0}
      if(s.dim)tone=Math.max(0,tone-s.dim);
      grid[y*W+x]={k:s.k,t:tone,id,g:s.g??id,line:s.line!==false};
    }
  });
  const out=grid.map(c=>c&&{...c});
  for(let y=0;y<HH;y++)for(let x=0;x<W;x++){const c=grid[y*W+x];if(!c||!c.line)continue;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=HH)continue;const q=grid[Y*W+X];
      if(q&&q.id<c.id&&q.g!==c.g){out[y*W+x].t=0;break}}}
  const res=Array.from({length:HH},()=>Array(W).fill(null));
  for(let y=0;y<HH;y++)for(let x=0;x<W;x++){const c=out[y*W+x];
    if(c){res[y][x]=ramp(col(c.k))[c.t];continue}
    for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=HH)continue;const nb=out[Y*W+X];if(nb){res[y][x]=ramp(col(nb.k))[4];break}}}
  for(const d of details)for(let j=d.y;j<d.y+d.h;j++)for(let i=d.x;i<d.x+d.w;i++)if(i>=0&&i<W&&j>=0&&j<HH)res[j][i]=d.k[0]==='#'?d.k:ramp(col(d.k))[d.t];
  return res;
}

/** Monta um sprite com as primitivas E/C/P/F sem transformação (usado pelos objetos do mapa). */
export function shapeSprite(w,h,build,pal){const sh=[],dt=[];
  const E=(cx,cy,rx,ry,k,o={})=>sh.push({t:'e',cx,cy,rx,ry,k,...o});
  const C=(x,y,ww,hh,k,o={})=>sh.push({t:'c',x,y,w:ww,h:hh,k,r:o.r??Math.min(3,ww/2,hh/2),...o});
  const P=(pts,k,o={})=>sh.push({t:'p',pts,k,...o});
  const F=(x,y,ww,hh,k,t=2)=>dt.push({x,y,w:ww,h:hh,k,t});
  build({E,C,P,F});return render64(sh,dt,pal,w,h)}
