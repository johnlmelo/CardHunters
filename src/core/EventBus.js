/**
 * Barramento de eventos simples. Permite que camadas (cena, interface, serviços)
 * conversem sem depender umas das outras diretamente.
 */
export class EventBus {
  #handlers = new Map();

  on(event, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#handlers.get(event)?.delete(handler);
  }

  emit(event, payload) {
    for (const handler of this.#handlers.get(event) ?? []) handler(payload);
  }
}

export const bus = new EventBus();
