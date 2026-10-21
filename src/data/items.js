/** Poderes concedidos pelos equipamentos. */
export const ABILITIES = {
  saque:{n:'Saque',d:'Ao destruir um Cativo, ganha +1 de energia no turno.'},
  investida:{n:'Investida',d:'+1 de ataque no turno em que entra em campo e pode atacar até no primeiro turno do duelo.'},
  escudo:{n:'Escudo',d:'Anula o primeiro ataque que receber no duelo.'},
  sangue:{n:'Sanguessuga',d:'Ao destruir um Cativo, você recupera 1 de vida.'},
  perfurar:{n:'Perfurar',d:'Ignora 2 de defesa do alvo ao atacar.'},
  contra:{n:'Contra-ataque',d:'Quando atacado, revida: se o ataque dele for maior ou igual à defesa do atacante, o atacante é destruído.'},
  espelho:{n:'Espelho',d:'Ao atacar, usa o ataque do alvo quando ele for maior que o seu.'}
};

/** Equipamentos. Só servem em Cativos do mesmo tipo. */
export const ITEMS = {
  i_moeda:{name:'Moeda da Sorte',type:'ouro',atk:1,ab:'saque',icon:'coin'},
  i_ancora:{name:'Âncora de Bronze',type:'ouro',def:2,icon:'anchor'},
  i_sabre:{name:'Sabre do Capitão',type:'ouro',atk:2,ab:'investida',icon:'sword',rare:1},
  i_presas:{name:'Presas de Javali',type:'fome',atk:2,icon:'fang'},
  i_casca:{name:'Casca Grossa',type:'fome',def:1,ab:'escudo',icon:'shell'},
  i_dente:{name:'Dente Vampiro',type:'fome',atk:1,ab:'sangue',icon:'drop',rare:1},
  i_elmo:{name:'Elmo de Ferro',type:'ferro',def:2,icon:'helmet'},
  i_picareta:{name:'Picareta Afiada',type:'ferro',atk:1,ab:'perfurar',icon:'pick'},
  i_couraca:{name:'Couraça Espinhosa',type:'ferro',def:1,ab:'contra',icon:'spike',rare:1},
  i_cetro:{name:'Cetro Sagrado',type:'poder',atk:2,icon:'scepter'},
  i_manto:{name:'Manto Real',type:'poder',def:1,ab:'escudo',icon:'cape'},
  i_coroa:{name:'Coroa de Espinhos',type:'poder',atk:1,ab:'contra',icon:'crown',rare:1},
  i_mascara:{name:'Máscara Dupla',type:'inveja',atk:1,def:1,icon:'mask'},
  i_veu:{name:'Véu Sombrio',type:'inveja',def:1,ab:'investida',icon:'veil'},
  i_espelho:{name:'Espelho Rachado',type:'inveja',ab:'espelho',icon:'mirror',rare:1}
};

/** Espaços de equipamento por raridade. */
export const SLOTS_BY_RARITY = { comum: 1, rara: 2, 'lendária': 3 };

/** Itens com que todo jogador começa. */
export const STARTER_ITEMS = ['i_moeda', 'i_presas', 'i_elmo'];
