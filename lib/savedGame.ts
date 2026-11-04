import type { Cell } from '../components/GameBoard';
import type { TetrisPiece } from '../components/TetrisPieces';
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
