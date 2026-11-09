import type { Cell } from '../components/GameBoard';
import { TILE_COLORS, type TileColor } from '../components/LetrisUI';
import { ENCAIXE, ENCAIXE_SHAPES } from '../config/encaixe';
import { findWords, type FoundWord } from '../components/WordDetector';

// Regras do modo Encaixe, sem React (testadas em tests/logica).

export interface TrayPiece {
  id: number;
  shape: boolean[][];
  /** Letra de cada bloco ('' onde não há bloco) */
  letters: string[][];
  color: TileColor;
}

export const emptyCell = (): Cell => ({ letter: null, color: null, isActive: false, isHighlighted: false });

export const emptyGrid = (cols = ENCAIXE.cols, rows = ENCAIXE.rows): Cell[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, emptyCell));

const shapeFromRows = (rows: string[]) => rows.map(r => Array.from(r).map(c => c === '#'));

let nextId = 1;

/** Peça nova sorteada pelo peso, com uma letra do gerador do nível em cada bloco */
export function randomTrayPiece(nextLetter: () => string, random = Math.random): TrayPiece {
  const total = ENCAIXE_SHAPES.reduce((sum, s) => sum + s.weight, 0);
  let pick = random() * total;
  const chosen = ENCAIXE_SHAPES.find(s => (pick -= s.weight) < 0) ?? ENCAIXE_SHAPES[0];
  const shape = shapeFromRows(chosen.rows);
  return {
    id: nextId++,
    shape,
    letters: shape.map(row => row.map(filled => (filled ? nextLetter() : ''))),
    color: TILE_COLORS[Math.floor(random() * TILE_COLORS.length)],
  };
}

/** Peça a partir de linhas de letras ("." = vazio), para testes e tutorial */
export function pieceFromRows(rows: string[], color: TileColor = 'orange'): TrayPiece {
  const chars = rows.map(r => Array.from(r));
  const width = Math.max(...chars.map(r => r.length));
  return {
    id: nextId++,
    shape: chars.map(r => Array.from({ length: width }, (_, i) => r[i] !== undefined && r[i] !== '.')),
    letters: chars.map(r => Array.from({ length: width }, (_, i) => (r[i] && r[i] !== '.' ? r[i] : ''))),
    color,
  };
}

export const blockCount = (piece: TrayPiece) => piece.shape.flat().filter(Boolean).length;

/** A peça cabe com o canto superior esquerdo em (row, col)? */
export function canPlace(grid: Cell[][], piece: TrayPiece, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= grid.length || gc < 0 || gc >= grid[0].length) return false;
      if (grid[gr][gc].letter !== null) return false;
    }
  }
  return true;
}

/** Gira 90° no sentido horário; cada letra acompanha o seu bloco */
export function rotatePiece(piece: TrayPiece): TrayPiece {
  const h = piece.shape.length;
  const w = piece.shape[0].length;
  const turn = <T,>(m: T[][]) => Array.from({ length: w }, (_, r) => Array.from({ length: h }, (_, c) => m[h - 1 - c][r]));
  return { ...piece, shape: turn(piece.shape), letters: turn(piece.letters) };
}

/** As 4 posições da peça (girando) */
export const rotations = (piece: TrayPiece): TrayPiece[] =>
  [piece, rotatePiece(piece), rotatePiece(rotatePiece(piece)), rotatePiece(rotatePiece(rotatePiece(piece)))];

/** Cabe em algum lugar do tabuleiro? (sem nenhum lugar para as 3 = fim de jogo) */
export function fitsAnywhere(grid: Cell[][], piece: TrayPiece): boolean {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (canPlace(grid, piece, row, col)) return true;
    }
  }
  return false;
}

export function placePiece(grid: Cell[][], piece: TrayPiece, row: number, col: number, preview = false): Cell[][] {
  const next = grid.map(r => r.map(cell => ({ ...cell })));
  piece.shape.forEach((line, r) => line.forEach((filled, c) => {
    if (filled) next[row + r][col + c] = { letter: piece.letters[r][c], color: piece.color, isActive: preview, isHighlighted: false };
  }));
  return next;
}

export const fullRows = (grid: Cell[][]) =>
  grid.map((row, i) => (row.every(c => c.letter !== null) ? i : -1)).filter(i => i >= 0);

export const fullCols = (grid: Cell[][]) =>
  grid[0].map((_, col) => (grid.every(row => row[col].letter !== null) ? col : -1)).filter(i => i >= 0);

export interface Clear {
  words: FoundWord[];
  rows: number[];
  cols: number[];
  /** Casas que somem (palavras + linhas + colunas), como "linha,coluna" */
  cells: Set<string>;
}

/** O que some neste tabuleiro: palavras da lista, linhas e colunas completas */
export function findClear(grid: Cell[][], validWords: Set<string>): Clear {
  const words = findWords(grid, validWords);
  const rows = fullRows(grid);
  const cols = fullCols(grid);
  const cells = new Set<string>();
  words.forEach(w => w.positions.forEach(p => cells.add(`${p.row},${p.col}`)));
  rows.forEach(r => grid[r].forEach((_, c) => cells.add(`${r},${c}`)));
  cols.forEach(c => grid.forEach((_, r) => cells.add(`${r},${c}`)));
  return { words, rows, cols, cells };
}

/** Esvazia as casas (sem gravidade: o resto não se mexe) */
export function clearCells(grid: Cell[][], cells: Set<string>): Cell[][] {
  return grid.map((row, r) => row.map((cell, c) => (cells.has(`${r},${c}`) ? emptyCell() : { ...cell, isHighlighted: false })));
}

/** Marca as casas que vão sumir (brilho) */
export function highlightCells(grid: Cell[][], cells: Set<string>): Cell[][] {
  return grid.map((row, r) => row.map((cell, c) => ({ ...cell, isHighlighted: cells.has(`${r},${c}`) })));
}
