// Preferências e recordes guardados no aparelho. localStorage pode falhar
// (modo privado, armazenamento bloqueado), então tudo tem valor padrão.

const PREFIX = 'letris:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // sem armazenamento: segue sem salvar
  }
}

export const KEYS = {
  controlMode: 'controlMode',
  bestScore: 'bestScore',
  bestLevel: 'bestLevel',
} as const;
