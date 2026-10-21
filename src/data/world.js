/** Regiões da ilha. */
export const REGION_NAMES = { porto: 'Porto dos Náufragos', selva: 'Selva Faminta', minas: 'Minas do Nunca-Basta', templo: 'Templo do Coração' };
export const REGION_TYPE = { porto: 'ouro', selva: 'fome', minas: 'ferro', templo: 'poder' };

/** Guardiões de cada região. */
export const GUARDIAN_NAMES = { porto: 'Capitã Doblões', selva: 'Boca-Mansa', minas: 'Condessa do Cofre', templo: 'Coroado Vazio' };

/** Duelistas comuns de cada região (o templo não tem). */
export const REGION_DUELISTS = { porto: ['Marujo', 'Pirata'], selva: ['Caçadora', 'Andarilho'], minas: ['Mineiro', 'Velha Garimpeira'] };

/** Quantidade de baús por região na ilha. */
export const ISLAND_CHESTS = [['porto', 4], ['selva', 4], ['minas', 4], ['templo', 2]];

/** Cavernas (lugares secretos com mapa próprio). A fase de cada uma está em PHASES[].gen.caves. */
export const CAVES = {
  gruta: { name: 'Gruta da Maré', style: 'mare', reg: 'porto', seed: 101, chests: 2, boost: 30 },
  toca: { name: 'Toca das Raízes', style: 'raiz', reg: 'selva', seed: 202, chests: 2, boost: 30, npc: { name: 'Eremita', type: 'fome', look: 'fome', guardian: false } },
  mina: { name: 'Mina Funda', style: 'mina', reg: 'minas', seed: 303, chests: 1, boost: 35, npc: { name: 'Mineiro Perdido', type: 'ferro', look: 'ferro', guardian: true } },
  cripta: { name: 'Cripta do Coração', style: 'cripta', reg: 'templo', seed: 404, chests: 1, boost: 45, npc: { name: 'Sentinela da Cripta', type: 'poder', look: 'poder', guardian: true } },
  contrabando: { name: 'Caverna dos Contrabandistas', style: 'mare', reg: 'porto', seed: 105, chests: 2, boost: 30, npc: { name: 'Contrabandista', type: 'ouro', look: 'ouro', guardian: false } },
  ninho: { name: 'Ninho de Raízes', style: 'raiz', reg: 'selva', seed: 206, chests: 2, boost: 30 },
  galeria: { name: 'Galeria Desabada', style: 'mina', reg: 'minas', seed: 307, chests: 2, boost: 35, npc: { name: 'Capataz Soterrado', type: 'ferro', look: 'ferro', guardian: false } },
  catacumbas: { name: 'Catacumbas', style: 'cripta', reg: 'templo', seed: 408, chests: 2, boost: 45, npc: { name: 'Guardião Ossudo', type: 'poder', look: 'poder', guardian: true } },
};

/** Cor do brilho dos cristais por estilo de caverna. */
export const CAVE_CRYSTAL_COLOR = { cripta: '#b58bf0', raiz: '#9be27a', mina: '#ffd95e', mare: '#7fe0d6' };
