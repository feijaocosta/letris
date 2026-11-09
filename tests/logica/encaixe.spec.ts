import { test, expect } from '@playwright/test';
import {
  canPlace, clearCells, emptyGrid, findClear, fitsAnywhere, pieceFromRows, placePiece, randomTrayPiece,
} from '../../lib/encaixe';
import { ENCAIXE, ENCAIXE_SHAPES } from '../../config/encaixe';

// Modo Encaixe: regras do tabuleiro sem gravidade
const board = (rows: string[]) => {
  const grid = emptyGrid();
  rows.forEach((text, i) => {
    const row = ENCAIXE.rows - rows.length + i;
    Array.from(text).forEach((letter, col) => {
      if (letter !== '.') grid[row][col] = { letter, color: 'blue', isActive: false, isHighlighted: false };
    });
  });
  return grid;
};
const text = (grid: ReturnType<typeof emptyGrid>) => grid.map(r => r.map(c => c.letter ?? '.').join(''));

test('tabuleiro de 8 colunas × 10 linhas', () => {
  expect(emptyGrid()).toHaveLength(10);
  expect(emptyGrid()[0]).toHaveLength(8);
});

test('a peça só entra dentro do tabuleiro e em casas vazias', () => {
  const grid = board(['Z.......']);
  const piece = pieceFromRows(['AB']);
  expect(canPlace(grid, piece, 9, 1)).toBe(true);
  expect(canPlace(grid, piece, 9, 0), 'em cima de outra letra').toBe(false);
  expect(canPlace(grid, piece, 9, 7), 'saindo pela direita').toBe(false);
  expect(canPlace(grid, piece, -1, 0), 'saindo por cima').toBe(false);
});

test('a peça fica exatamente onde é solta (sem gravidade)', () => {
  const placed = placePiece(emptyGrid(), pieceFromRows(['AB']), 2, 3);
  expect(text(placed)[2]).toBe('...AB...');
  expect(text(placed)[9]).toBe('........');
});

test('linha completa e coluna completa somem; o resto não se mexe', () => {
  const rows = ['X.......', 'X.......', 'X.......', 'X.......', 'X.......', 'X.......', 'X.......', 'X.......', 'X.......', 'XZZZZZZZ'];
  const grid = board(rows);
  const clear = findClear(grid, new Set());
  expect(clear.rows).toEqual([9]);
  expect(clear.cols).toEqual([0]);
  const after = text(clearCells(grid, clear.cells));
  expect(after.every(r => r === '........')).toBe(true);

  const partial = board(['.Q......', 'ZZZZZZZZ']);
  const afterPartial = text(clearCells(partial, findClear(partial, new Set()).cells));
  expect(afterPartial[8], 'a letra de cima continua no mesmo lugar').toBe('.Q......');
  expect(afterPartial[9]).toBe('........');
});

test('palavra da lista some e o que está em cima fica parado', () => {
  const grid = board(['Q.......', 'SOL.....']);
  const clear = findClear(grid, new Set(['SOL']));
  expect(clear.words.map(w => w.word)).toEqual(['SOL']);
  const after = text(clearCells(grid, clear.cells));
  expect(after[8]).toBe('Q.......');
  expect(after[9]).toBe('........');
});

test('fim de jogo: nenhuma peça cabe', () => {
  const full = board(Array(10).fill('Z.Z.Z.Z.'));
  expect(fitsAnywhere(full, pieceFromRows(['AB']))).toBe(false);
  expect(fitsAnywhere(full, pieceFromRows(['A']))).toBe(true);
});

test('peças sorteadas: formatos válidos e uma letra por bloco', () => {
  let i = 0;
  const letters = 'AEIOU';
  for (let n = 0; n < 300; n++) {
    const piece = randomTrayPiece(() => letters[i++ % letters.length]);
    const blocks = piece.shape.flat().filter(Boolean).length;
    expect(blocks).toBeGreaterThanOrEqual(1);
    expect(blocks).toBeLessThanOrEqual(6);
    piece.shape.forEach((row, r) => row.forEach((filled, c) => expect(Boolean(piece.letters[r][c])).toBe(filled)));
  }
  for (const s of ENCAIXE_SHAPES) expect(new Set(s.rows.map(r => r.length)).size, s.rows.join('/')).toBe(1);
});

test('sem girar por enquanto (chave desligada)', () => {
  expect(ENCAIXE.allowRotate).toBe(false);
});
