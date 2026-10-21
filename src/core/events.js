/** Nomes dos eventos trocados pelo barramento. */
export const EVENTS = Object.freeze({
  TOAST: 'ui:toast',
  HUD_REFRESH: 'ui:hud-refresh',
  INTRO_REQUEST: 'ui:intro-request',
  /** Cena trocada: { kind: 'map' | 'stage', name } */
  SCENE_CHANGED: 'game:scene-changed',
  CHEST_REACHED: 'world:chest-reached',
  /** Duelista do mapa vencido (depois da janela de prêmio): { id } */
  DUELIST_DEFEATED: 'duel:duelist-defeated',
  NPC_CHALLENGE: 'world:npc-challenge',
});
