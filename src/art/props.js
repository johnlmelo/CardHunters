/* Objetos do mapa em pixel art (árvores, rochas, casas, cavernas, baús...). */
import { PROP_PALETTE } from './palettes.js';
import { shapeSprite } from './shapeRenderer.js';

/** Largura da sombra projetada no chão por tipo de objeto. */
export const SHADOW_W={arvore:46,arvore2:46,palmeira:30,rocha:36,rocha_ouro:36,casa:100,poco:40,pilar:24,pilar_q:24,estatua:30,naufragio:90,barril:22,caixote:26,poste:12,estalagmite:22,raiz:30,escora:20};

/** Matriz de cores do objeto `k`. */
export function propArt(k){
  const sizes={arvore:[64,86],arvore2:[64,86],palmeira:[64,88],rocha:[48,40],rocha_ouro:[48,40],caixote:[32,32],barril:[28,36],casa:[108,104],barco:[92,48],
    naufragio:[112,64],pilar:[32,74],pilar_q:[32,58],estatua:[44,82],caverna_mare:[112,90],caverna_raiz:[112,90],caverna_mina:[112,90],escada:[64,64],
    estalagmite:[32,46],raiz:[48,40],escora:[32,60],cristal_mare:[28,38],cristal_raiz:[28,38],cristal_cripta:[28,38],lanterna:[20,30],poste:[20,58],poco:[48,50],arbusto:[36,28],tocha:[16,34],chest:[40,34],chestOpen:[40,38]};
  const[w,h]=sizes[k];
  return shapeSprite(w,h,({E,C,P,F})=>{
    const tree=(fruit)=>{C(27,54,10,28,'tr',{r:3});P([[22,84],[27,74],[37,74],[42,84]],'tr');E(32,36,26,21,'lf2');E(17,42,13,11,'lf');E(47,42,13,11,'lf');E(32,24,20,15,'lf');E(24,30,10,8,'lf3');
      F(20,48,1,6,'lf2',0);F(44,46,1,8,'lf2',0);if(fruit){for(const[a,b]of[[20,34],[40,28],[30,44],[46,40]])F(a,b,3,3,'fr',2)}};
    switch(k){
      case 'arvore':tree(false);break;case 'arvore2':tree(true);break;
      case 'palmeira':for(let i=0;i<9;i++)E(31+Math.round(Math.sin(i*.45)*3),82-i*7,4.5,4.5,'tr');
        for(const pts of[[[32,24],[4,30],[12,36]],[[32,24],[60,30],[52,36]],[[32,22],[10,12],[18,22]],[[32,22],[54,12],[46,22]],[[32,22],[30,4],[36,18]],[[32,26],[20,44],[28,30]],[[32,26],[46,44],[38,30]]])P(pts,'lf');
        E(29,27,3,3,'tr2');E(35,27,3,3,'tr2');break;
      case 'rocha':case 'rocha_ouro':E(24,27,21,12,'rk');E(15,22,10,8,'rk');E(31,19,12,10,'rk');if(k==='rocha_ouro'){F(14,24,3,2,'ou',3);F(30,16,2,2,'ou',3);F(34,28,3,2,'ou',2)}break;
      case 'caixote':C(4,6,24,24,'wd',{r:1});F(4,6,24,2,'wd',3);F(4,17,24,1,'wd',0);F(15,6,1,24,'wd',0);for(let i=0;i<18;i++)F(6+i,8+i,1,1,'wd',0);break;
      case 'barril':E(14,19,11,15,'wd');F(3,10,22,2,'mt');F(3,27,22,2,'mt');E(14,6,10,3,'wd',{tone:3});break;
      case 'casa':C(10,46,88,50,'wd',{r:2});for(let i=0;i<5;i++)F(10,56+i*9,88,1,'wd',0);
        P([[0,52],[54,6],[108,52]],'th');P([[0,52],[108,52],[100,60],[8,60]],'th',{tone:1});for(let i=0;i<6;i++)F(16+i*7,46-i*6,76-i*14,1,'th',1);
        C(68,10,10,26,'st',{r:1});C(46,66,18,30,'wd2',{r:2});F(60,80,2,2,'ou',3);C(20,64,16,14,'jn',{r:1});F(27,64,1,14,'wd',0);F(20,70,16,1,'wd',0);C(74,64,16,14,'jn',{r:1});F(81,64,1,14,'wd',0);F(74,70,16,1,'wd',0);break;
      case 'barco':P([[4,18],[88,18],[76,42],[16,42]],'wd2');F(4,18,84,3,'wd',3);C(44,0,4,20,'tr');P([[48,2],[72,15],[48,15]],'cn');break;
      case 'naufragio':P([[6,40],[104,26],[96,60],[16,62]],'wd2');for(let i=0;i<6;i++)C(20+i*14,22+Math.round(i*-1.5),4,26,'wd',{r:1});C(60,4,5,30,'tr',{r:1});P([[64,6],[94,20],[66,22]],'cn',{dim:1});F(30,48,40,2,'wd',0);break;
      case 'pilar':C(8,12,16,56,'st',{r:2});C(4,6,24,8,'st',{r:1});C(4,64,24,9,'st',{r:1});F(12,16,1,48,'st',0);F(19,16,1,48,'st',0);F(9,30,4,6,'mo',2);break;
      case 'pilar_q':C(8,18,16,34,'st',{r:2});P([[8,20],[12,10],[16,16],[20,8],[24,18]],'st');C(4,48,24,9,'st',{r:1});F(12,20,1,28,'st',0);F(19,20,1,28,'st',0);break;
      case 'estatua':C(6,60,32,20,'st',{r:2});C(12,30,20,30,'st',{r:7});E(22,22,9,10,'st');P([[12,14],[14,6],[18,12],[22,4],[26,12],[30,6],[32,14]],'ou');F(18,21,2,2,'stp',3);F(25,21,2,2,'stp',3);F(10,66,24,1,'st',0);break;
      case 'caverna_mare':case 'caverna_raiz':case 'caverna_mina':{const rk=k==='caverna_mare'?'rkb':'rk';
        E(56,56,54,32,rk);E(28,42,26,22,rk);E(84,42,26,22,rk);E(56,26,32,20,rk);C(36,58,40,32,'dk',{tone:2,r:14,line:false});C(42,64,28,26,'#050305',{tone:2,r:10,line:false});
        if(k==='caverna_mina'){C(32,50,6,40,'tr');C(74,50,6,40,'tr');C(28,46,56,7,'tr');E(56,40,4,4,'lam',{tone:3,line:false});F(46,86,1,4,'mt');F(65,86,1,4,'mt')}
        if(k==='caverna_raiz'){E(18,66,16,14,'lf');E(94,66,16,14,'lf');E(56,28,22,12,'lf2');P([[30,40],[40,70],[44,70],[36,40]],'tr');P([[80,40],[70,70],[74,70],[84,40]],'tr')}
        if(k==='caverna_mare'){F(24,76,4,8,'sw');F(86,74,4,10,'sw');F(30,80,3,6,'sw');F(80,80,3,6,'sw')}break}
      case 'escada':C(2,2,60,60,'st',{r:3});C(10,10,44,44,'dk',{tone:2,r:2,line:false});for(let i=0;i<4;i++)C(12,12+i*10,40,6,'st',{tone:Math.max(0,2-i),r:0,line:false});
        F(6,4,4,2,'stp',3);F(54,4,4,2,'stp',3);F(6,58,4,2,'stp',3);F(54,58,4,2,'stp',3);break;
      case 'estalagmite':P([[4,44],[12,10],[16,2],[20,10],[28,44]],'rk');P([[20,44],[25,24],[30,44]],'rk');break;
      case 'raiz':P([[2,38],[10,20],[18,30],[22,8],[28,28],[36,14],[46,38]],'tr');F(14,24,2,2,'crg',3);break;
      case 'escora':C(4,4,24,6,'tr');C(6,8,5,50,'tr');C(21,8,5,50,'tr');break;
      case 'cristal_mare':case 'cristal_raiz':case 'cristal_cripta':{const ck=k==='cristal_cripta'?'crp':k==='cristal_raiz'?'crg':'cr';
        P([[6,36],[9,14],[13,4],[17,14],[19,36]],ck);P([[15,36],[20,18],[25,22],[25,36]],ck);P([[2,36],[4,24],[8,30],[8,36]],ck);F(11,10,2,10,'#ffffff');break}
      case 'lanterna':C(6,2,8,4,'mt');C(5,6,10,14,'mt',{r:2});E(10,13,3.5,5,'lam',{tone:3,line:false});F(9,20,2,8,'tr');break;
      case 'tocha':C(6,14,4,20,'tr');E(8,9,5,7,'#ff8a3a',{tone:3,line:false});E(8,10,3,4,'lam',{tone:3,line:false});break;
      case 'poste':C(8,12,4,46,'mt');C(3,4,14,10,'mt',{r:2});E(10,9,4,4,'lam',{tone:3,line:false});break;
      case 'poco':E(24,36,21,12,'st');E(24,32,15,7,'#0b1a2a',{tone:2,line:false});C(5,6,4,28,'tr');C(39,6,4,28,'tr');P([[0,8],[24,0],[48,8]],'rf');F(9,14,30,2,'tr',1);break;
      case 'arbusto':E(18,18,16,10,'lf');E(10,14,9,8,'lf');E(26,14,9,8,'lf');E(18,10,8,6,'lf3');break;
      case 'chest':C(4,14,32,18,'wd',{r:2});C(4,5,32,12,'wd',{r:5});F(4,15,32,2,'ou',2);F(17,13,6,8,'ou',3);F(19,16,2,2,'dk');F(8,5,3,27,'ou',1);F(29,5,3,27,'ou',1);break;
      case 'chestOpen':C(4,18,32,18,'wd',{r:2});C(6,18,28,6,'#ffd95e',{tone:3,line:false});C(4,2,32,10,'wd',{r:4,dim:1});F(4,19,32,2,'ou',2);F(8,18,3,18,'ou',1);F(29,18,3,18,'ou',1);break;
    }
  },PROP_PALETTE);
}
