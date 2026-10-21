/* Web Worker: calcula os pixels do chão fora da thread principal (ver groundPainter.js). */
import { computeGround } from './groundPainter.js';

self.onmessage = e => {
  const { id, map } = e.data;
  const data = computeGround(map);
  self.postMessage({ id, data }, [data.buffer]);
};
