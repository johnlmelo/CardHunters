export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** Vizinhança de 4 direções. */
export const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
