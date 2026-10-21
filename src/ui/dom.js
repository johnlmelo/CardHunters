/* Utilidades de DOM. */
export const $ = id => document.getElementById(id);
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const isAnyOverlayOpen = () => !!document.querySelector('.overlay:not([hidden])');
