/** Tipos de Cativo e o ciclo de vantagem (+50% de dano). */
export const TYPES = { ouro: 'Ouro', fome: 'Fome', ferro: 'Ferro', poder: 'Poder', inveja: 'Inveja' };
export const BEATS = { ouro: 'fome', fome: 'ferro', ferro: 'poder', poder: 'inveja', inveja: 'ouro' };

/** Cor de cada tipo (mesmas das variáveis CSS --ouro, --fome...). */
export const TYPE_COLORS = { ouro: 0xe0a526, fome: 0x3f9b4c, ferro: 0x7d8794, poder: 0x8a52d1, inveja: 0x22a197 };
