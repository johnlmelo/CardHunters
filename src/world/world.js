/*
 * Registro dos mapas do jogo: a ilha (só a miniatura do mapa de fases), as fases (cada uma
 * com mapa próprio) e as cavernas de cada fase, com os portais ligados.
 */
import { PHASES, phaseById, phaseMapId } from '../data/phases.js';
import { generateCave } from './caveGenerator.js';
import { generateIsland } from './islandGenerator.js';
import { generatePhase } from './phaseGenerator.js';

/** Todos os mapas por id. `ilha` não é jogável; fases e cavernas são. */
export const MAPS = {};

/** Gera todos os mapas uma única vez e liga os portais fase ↔ caverna. */
export function buildWorld() {
  if (MAPS.ilha) return;
  MAPS.ilha = generateIsland();
  for (const phase of PHASES) {
    const pm = MAPS[phaseMapId(phase.id)] = generatePhase(phase);
    for (const caveId of phase.gen.caves) {
      const cave = MAPS[caveId] = generateCave(caveId);
      const toCave = pm.portals.find(p => p.to === caveId), spot = pm.caveSpots[caveId], back = cave.portals[0];
      if (toCave) { toCave.ax = cave.start.x; toCave.ay = cave.start.y; }
      back.to = pm.id;
      if (spot) { back.ax = spot.x; back.ay = spot.y + 1; }
    }
  }
}

export const isWorldBuilt = () => !!MAPS.ilha;
export const isPlayableMap = id => !!MAPS[id] && id !== 'ilha';

/** Cavernas com entrada na fase. */
export const cavesOf = phaseId => phaseById(phaseId).gen.caves.filter(id => MAPS[phaseMapId(phaseId)].caveSpots[id]);

const allCaves = () => PHASES.flatMap(p => cavesOf(p.id));
const phaseMaps = () => PHASES.map(p => MAPS[phaseMapId(p.id)]);

export const secretTotal = () => phaseMaps().reduce((a, m) => a + m.secrets.length, 0) + allCaves().length;
export const chestTotal = () => [...phaseMaps(), ...allCaves().map(id => MAPS[id])].reduce((a, m) => a + m.chests.length, 0);
