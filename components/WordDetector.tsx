interface Cell {
  letter: string | null;
  isActive: boolean;
  isHighlighted: boolean;
}

interface ColoredCell extends Cell {
  color?: unknown;
}

export interface FoundWord {
  word: string;
  positions: { row: number; col: number }[];
  direction: 'horizontal' | 'vertical';
}

const MIN_LENGTH = 3;
const MAX_LENGTH = 8;

/**
 * Encontra palavras válidas no grid (horizontal e vertical).
 * Quando uma palavra está dentro de outra na mesma linha/coluna
 * (SAL dentro de SALTO), vale só a maior.
 */
export function findWords(grid: Array<Array<{ letter: string | null }>>, valid: Set<string>): FoundWord[] {
  const found: FoundWord[] = [];
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const scan = (direction: FoundWord['direction'], lines: number, length: number, at: (line: number, i: number) => { row: number; col: number }) => {
    for (let line = 0; line < lines; line++) {
      for (let start = 0; start <= length - MIN_LENGTH; start++) {
        let word = '';
        const positions: { row: number; col: number }[] = [];
        for (let i = start; i < Math.min(length, start + MAX_LENGTH); i++) {
          const pos = at(line, i);
          const letter = grid[pos.row][pos.col].letter;
          if (!letter) break;
          word += letter;
          positions.push(pos);
          if (word.length >= MIN_LENGTH && valid.has(word)) {
            found.push({ word, positions: [...positions], direction });
          }
        }
      }
    }
  };

  scan('horizontal', rows, cols, (row, i) => ({ row, col: i }));
  scan('vertical', cols, rows, (col, i) => ({ row: i, col }));

  const key = (p: { row: number; col: number }) => `${p.row}:${p.col}`;
  return found.filter(word => !found.some(other => {
    if (other === word || other.direction !== word.direction || other.positions.length <= word.positions.length) return false;
    const otherCells = new Set(other.positions.map(key));
    return word.positions.every(p => otherCells.has(key(p)));
  }));
}

export function highlightWords<T extends Cell>(grid: T[][], words: FoundWord[]): T[][] {
  const newGrid = grid.map(row => 
    row.map(cell => ({ ...cell, isHighlighted: false }))
  );

  words.forEach(foundWord => {
    foundWord.positions.forEach(pos => {
      if (pos.row >= 0 && pos.row < newGrid.length && 
          pos.col >= 0 && pos.col < newGrid[0].length) {
        newGrid[pos.row][pos.col].isHighlighted = true;
      }
    });
  });

  return newGrid;
}

export function removeWords<T extends ColoredCell>(grid: T[][], words: FoundWord[]): T[][] {
  const newGrid = grid.map(row => 
    row.map(cell => ({ ...cell }))
  );

  words.forEach(foundWord => {
    foundWord.positions.forEach(pos => {
      if (pos.row >= 0 && pos.row < newGrid.length && 
          pos.col >= 0 && pos.col < newGrid[0].length) {
        newGrid[pos.row][pos.col].letter = null;
        if ('color' in newGrid[pos.row][pos.col]) newGrid[pos.row][pos.col].color = null;
        newGrid[pos.row][pos.col].isActive = false;
        newGrid[pos.row][pos.col].isHighlighted = false;
      }
    });
  });

  return newGrid;
}