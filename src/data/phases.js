/**
 * Fases da ilha, na ordem do caminho no mapa. Cada fase é uma região com mapa próprio, e a
 * próxima só abre depois de vencer o chefe (`boss`, id do guardião da região).
 *
 * `gen` configura o gerador da fase:
 * - W, H: tamanho em tiles; seed: semente fixa (o mapa é sempre o mesmo)
 * - chests / chestGap: quantidade de baús e distância mínima entre eles
 * - boost: chance extra de cartas raras nos baús (progressão)
 * - duelists: nomes dos duelistas comuns; extraGuardian: guardião opcional extra
 * - secrets: tipo de parede de cada área secreta ('arvore' | 'rocha')
 * - caves: cavernas (ids de CAVES) com entrada nesta fase
 * - lakes: limiar do ruído para lagos internos (maior = menos lagos)
 */
export const PHASES = [
  {
    id: 'porto', number: 1, reg: 'porto', boss: 'g_porto',
    gen: {
      W: 100, H: 78, seed: 3101, chests: 16, chestGap: 9, boost: 0, lakes: 0.68,
      duelists: ['Marujo', 'Pirata', 'Grumete Zeca', 'Contramestra'],
      extraGuardian: { name: 'Ninguém', type: 'inveja', nid: 'g_ninguem', look: 'g_ninguem' },
      secrets: ['arvore', 'rocha'], caves: ['gruta', 'contrabando'],
    },
  },
  {
    id: 'selva', number: 2, reg: 'selva', boss: 'g_selva',
    gen: {
      W: 102, H: 80, seed: 3202, chests: 16, chestGap: 9, boost: 10, lakes: 0.64,
      duelists: ['Caçadora', 'Andarilho', 'Erva-Doce', 'Mateiro'],
      secrets: ['arvore', 'arvore'], caves: ['toca', 'ninho'],
    },
  },
  {
    id: 'minas', number: 3, reg: 'minas', boss: 'g_minas',
    gen: {
      W: 104, H: 80, seed: 3303, chests: 17, chestGap: 9, boost: 20, lakes: 0.7,
      duelists: ['Mineiro', 'Velha Garimpeira', 'Capataz', 'Picareta'],
      secrets: ['rocha', 'rocha'], caves: ['mina', 'galeria'],
    },
  },
  {
    id: 'templo', number: 4, reg: 'templo', boss: 'g_templo',
    gen: {
      W: 106, H: 82, seed: 3404, chests: 17, chestGap: 9, boost: 25, lakes: 0.66,
      duelists: ['Sacristão', 'Peregrina', 'Vigia de Pedra', 'Devota'],
      secrets: ['arvore', 'rocha'], caves: ['cripta', 'catacumbas'],
    },
  },
];

/** Id do mapa jogável de uma fase. */
export const phaseMapId = id => 'fase_' + id;

export const phaseById = id => PHASES.find(p => p.id === id);

/** Fase dona de uma caverna. */
export const phaseOfCave = caveId => PHASES.find(p => p.gen.caves.includes(caveId));
