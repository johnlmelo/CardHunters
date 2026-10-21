/** Tamanho de um tile do mapa, em pixels. */
export const TILE = 32;

/** Chave do salvamento local (mantida para preservar o progresso já salvo). */
export const STORAGE_KEY = 'ilha-cobica-v1';

/** Versão do mapa. Ao mudar, baús e posição salvos são reiniciados. */
export const MAP_VERSION = 3;

/* Regras do duelo */
export const DECK_SIZE = 9;
export const MAX_ROUNDS = 30;
export const FIELD_SIZE = 5;
export const MAX_ENERGY = 6;

/** Vida inicial (calibrada por simulação de 4.000 duelos por cenário). */
export const LIFE = { base: 10, guard: 11 };
