/*
 * Sessão de exploração: guarda a cena ativa e controla a trava do movimento.
 * A interface informa (via sondas) se há duelo ou janela aberta, sem a cena depender do DOM.
 */
import { pressedKeys } from './keyboard.js';

let activeScene = null;
let probes = { isDuelActive: () => false, isOverlayOpen: () => false };

export const setActiveScene = s => { activeScene = s; };
export const getActiveScene = () => activeScene;

export function setUiProbes(p) { probes = { ...probes, ...p }; }
export const isDuelActive = () => probes.isDuelActive();
export const isOverlayOpen = () => probes.isOverlayOpen();

/** Trava (true) ou libera (false) o movimento do herói. */
export function lockWorld(v) {
  if (v) pressedKeys.clear();
  if (activeScene) { activeScene.locked = v; if (v) activeScene.path = []; }
}

/** Menus do HUD só abrem com a cena pronta e livre. */
export const canOpenMenu = () => !!activeScene && !activeScene.locked;

const AUTO_UNLOCK_FRAMES = 40;

/**
 * Trava de segurança: se a cena ficou travada sem nenhuma janela aberta nem duelo,
 * o movimento volta depois de alguns quadros. Chamar a cada quadro.
 */
export function releaseStuckLock(scene, introDone) {
  if (scene.locked && !scene.moving && introDone && !isDuelActive() && !isOverlayOpen()) {
    if ((scene.idleLock = (scene.idleLock || 0) + 1) > AUTO_UNLOCK_FRAMES) { scene.locked = false; scene.idleLock = 0; }
  } else scene.idleLock = 0;
}
