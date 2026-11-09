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

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // sem armazenamento: nada a apagar
  }
}

export const KEYS = {
  controlMode: 'controlMode',
  lang: 'lang',
  /** Tutorial visto (ou pulado): não aparece mais sozinho */
  tutorialDone: 'tutorialDone',
  /** O mesmo, no modo Encaixe */
  encaixeTutorialDone: 'tutorialDone:encaixe',
} as const;

/** Já jogou este modo alguma vez (tem recorde dele em algum idioma)? */
export function hasAnyRecord(mode: GameMode = 'classic'): boolean {
  // Clássico: "bestScore:pt"; Encaixe: "bestScore:encaixe:pt"
  const isMode = (key: string) => {
    const parts = key.slice(PREFIX.length).split(':');
    return parts[0] === 'bestScore' && (mode === 'classic' ? parts.length === 2 : parts[1] === mode);
  };
  try {
    return Object.keys(localStorage).some(k => k.startsWith(PREFIX) && isMode(k) && Number(localStorage.getItem(k)) > 0);
  } catch {
    return false;
  }
}

// Recordes separados por idioma: "bestScore:pt", "bestLevel:en"...
export type RecordKey = 'bestScore' | 'bestLevel';
export type GameMode = 'classic' | 'encaixe';
/** Clássico mantém as chaves de antes ("bestScore:pt"); os outros modos levam o nome ("bestScore:encaixe:pt") */
export const recordKey = (record: RecordKey, lang: string, mode: GameMode = 'classic') =>
  mode === 'classic' ? `${record}:${lang}` : `${record}:${mode}:${lang}`;

/**
 * Recordes de antes do multilíngue ("bestScore", "bestLevel") eram do jogo em
 * português: passam para ":pt" uma vez e a chave antiga é apagada.
 */
export function migrateRecords(lang: string) {
  for (const record of ['bestScore', 'bestLevel'] as const) {
    const old = load<number | null>(record, null);
    if (old === null) continue;
    const key = recordKey(record, lang);
    if (load<number | null>(key, null) === null) save(key, old);
    try {
      localStorage.removeItem(PREFIX + record);
    } catch {
      // sem armazenamento: nada a migrar
    }
  }
}
