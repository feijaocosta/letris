import { WordLibrary } from './WordLibrary';

interface Cell {
  letter: string | null;
  isActive: boolean;
  isHighlighted: boolean;
}

export interface FoundWord {
  word: string;
  positions: { row: number; col: number }[];
  direction: 'horizontal' | 'vertical'; // Removido 'diagonal'
}

// Remove todas as funções antigas e usa WordLibrary
export const getRequiredWordsForLevel = WordLibrary.getRequiredWordsForLevel;
export const getAvailableLettersForLevel = WordLibrary.getAvailableLettersForLevel;
export const getValidWordsForLevel = WordLibrary.getValidWordsForLevel;

/**
 * Encontra palavras válidas no grid (apenas horizontal e vertical)
 */
export function findWords(grid: Cell[][], level: number): FoundWord[] {
  const foundWords: FoundWord[] = [];
  const validWords = WordLibrary.getValidWordsForLevel(level);
  
  // Busca horizontal (esquerda para direita)
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col <= grid[row].length - 3; col++) { // Mínimo 3 letras
      for (let len = 3; len <= Math.min(8, grid[row].length - col); len++) { // Máximo 8 letras
        const positions: { row: number; col: number }[] = [];
        let word = '';
        let allFilled = true;
        
        for (let i = 0; i < len; i++) {
          if (grid[row][col + i].letter) {
            word += grid[row][col + i].letter;
            positions.push({ row, col: col + i });
          } else {
            allFilled = false;
            break;
          }
        }
        
        if (allFilled && WordLibrary.isValidNormalizedWord(word, level)) {
          foundWords.push({
            word,
            positions,
            direction: 'horizontal'
          });
        }
      }
    }
  }
  
  // Busca vertical (cima para baixo)
  for (let col = 0; col < grid[0].length; col++) {
    for (let row = 0; row <= grid.length - 3; row++) { // Mínimo 3 letras
      for (let len = 3; len <= Math.min(8, grid.length - row); len++) { // Máximo 8 letras
        const positions: { row: number; col: number }[] = [];
        let word = '';
        let allFilled = true;
        
        for (let i = 0; i < len; i++) {
          if (grid[row + i][col].letter) {
            word += grid[row + i][col].letter;
            positions.push({ row: row + i, col });
          } else {
            allFilled = false;
            break;
          }
        }
        
        if (allFilled && WordLibrary.isValidNormalizedWord(word, level)) {
          foundWords.push({
            word,
            positions,
            direction: 'vertical'
          });
        }
      }
    }
  }
  
  // Remove palavras duplicadas (mesmas posições)
  return foundWords.filter((word, index, array) => 
    index === array.findIndex(w => 
      w.word === word.word && 
      JSON.stringify(w.positions) === JSON.stringify(word.positions)
    )
  );
}

export function highlightWords(grid: Cell[][], words: FoundWord[]): Cell[][] {
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

export function removeWords(grid: Cell[][], words: FoundWord[]): Cell[][] {
  const newGrid = grid.map(row => 
    row.map(cell => ({ ...cell }))
  );

  words.forEach(foundWord => {
    foundWord.positions.forEach(pos => {
      if (pos.row >= 0 && pos.row < newGrid.length && 
          pos.col >= 0 && pos.col < newGrid[0].length) {
        newGrid[pos.row][pos.col].letter = null;
        newGrid[pos.row][pos.col].isActive = false;
        newGrid[pos.row][pos.col].isHighlighted = false;
      }
    });
  });

  return newGrid;
}