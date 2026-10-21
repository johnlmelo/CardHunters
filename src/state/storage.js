/**
 * Adaptador de persistência sobre o localStorage.
 * Qualquer objeto com { load(key), save(key, value) } pode substituí-lo.
 */
export const localStorageAdapter = {
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
  },
};
