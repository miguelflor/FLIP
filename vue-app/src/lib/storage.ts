/**
 * Typed access to the user preferences this app persists.
 *
 * Only genuine preferences belong here. Session state (the CLIP session id and
 * the aluno id map) is deliberately kept in memory: the Rust side stores each
 * session as a live `reqwest::Client` in an in-memory map, so a session id
 * cannot outlive the app process. Persisting one would only produce an id that
 * every command rejects as "Session not found or expired".
 */
const KEYS = {
  selectedAlunoId: 'selected_aluno_id',
  selectedYear: 'selected_year',
} as const;

export type StorageKey = keyof typeof KEYS;

export const storage = {
  get(key: StorageKey): string | null {
    return localStorage.getItem(KEYS[key]);
  },

  /** Writing a nullish value would persist the string "undefined", so it removes instead. */
  set(key: StorageKey, value: string | null | undefined): void {
    if (value === null || value === undefined) {
      localStorage.removeItem(KEYS[key]);
      return;
    }
    localStorage.setItem(KEYS[key], value);
  },

  remove(key: StorageKey): void {
    localStorage.removeItem(KEYS[key]);
  },

  clear(): void {
    localStorage.clear();
  },
};
