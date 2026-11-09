import type { Cell } from '../components/GameBoard';
import type { TetrisPiece } from '../components/TetrisPieces';
import type { TrayPiece } from './encaixe';
import { load, remove, save } from './storage';

// Partida guardada no aparelho, para continuar de onde parou quando o
// celular fecha a página em segundo plano (o iPhone faz isso depois de um
// tempo). Uma por idioma ("savedGame:pt"...). Gravada ao pausar, ao ir para
// o segundo plano, a cada peça nova e no resumo do nível; apagada no fim de
// jogo e ao começar uma partida nova.

const VERSION = 1;

export type SavedPhase = 'intro' | 'playing' | 'summary';

export interface SavedGame {
  v: typeof VERSION;
  savedAt: number;
  phase: SavedPhase;
  level: number;
  score: number;
  lines: number;
  grid: Cell[][];
  piece: TetrisPiece | null;
  next: TetrisPiece | null;
  levelWords: string[];
  found: string[];
  formed: string[];
  used: string[];
  gameWords: string[];
  levelStart: { score: number; lines: number };
  levelBonus: number;
  noLinesBonus: number;
  playedMs: number;
  gamePlayedMs: number;
}

const key = (lang: string) => `savedGame:${lang}`;

export function saveGame(lang: string, game: Omit<SavedGame, 'v' | 'savedAt'>) {
  save(key(lang), { ...game, v: VERSION, savedAt: Date.now() });
}

/** A partida guardada do idioma, ou null se não houver (ou for de outra versão). */
export function loadSavedGame(lang: string): SavedGame | null {
  const game = load<SavedGame | null>(key(lang), null);
  const valid = game?.v === VERSION && Array.isArray(game.grid) && game.grid.length === 20
    && game.grid.every(row => Array.isArray(row) && row.length === 10) && game.levelWords?.length > 0;
  return valid ? game : null;
}

export function clearSavedGame(lang: string) {
  remove(key(lang));
}

// ---------- Modo Encaixe ----------
// Mesma ideia, com a bandeja de peças no lugar da peça caindo. Chave própria
// ("savedGame:encaixe:pt"), para o Clássico e o Encaixe terem cada um a sua.

const ENCAIXE_VERSION = 1;

export interface SavedEncaixe {
  v: typeof ENCAIXE_VERSION;
  savedAt: number;
  phase: SavedPhase;
  level: number;
  score: number;
  lines: number;
  grid: Cell[][];
  tray: Array<TrayPiece | null>;
  levelWords: string[];
  found: string[];
  formed: string[];
  used: string[];
  gameWords: string[];
  levelStart: { score: number; lines: number };
  levelBonus: number;
  noLinesBonus: number;
  playedMs: number;
  gamePlayedMs: number;
}

const encaixeKey = (lang: string) => `savedGame:encaixe:${lang}`;

export function saveEncaixe(lang: string, game: Omit<SavedEncaixe, 'v' | 'savedAt'>) {
  save(encaixeKey(lang), { ...game, v: ENCAIXE_VERSION, savedAt: Date.now() });
}

export function loadSavedEncaixe(lang: string, rows: number, cols: number): SavedEncaixe | null {
  const game = load<SavedEncaixe | null>(encaixeKey(lang), null);
  const valid = game?.v === ENCAIXE_VERSION && Array.isArray(game.grid) && game.grid.length === rows
    && game.grid.every(row => Array.isArray(row) && row.length === cols) && game.levelWords?.length > 0
    && Array.isArray(game.tray);
  return valid ? game : null;
}

export function clearSavedEncaixe(lang: string) {
  remove(encaixeKey(lang));
}
