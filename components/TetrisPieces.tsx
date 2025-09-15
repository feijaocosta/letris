// Formas das peças do Tetris
export const TETRIS_SHAPES = {
  I: [
    [true, true, true, true]
  ],
  O: [
    [true, true],
    [true, true]
  ],
  T: [
    [false, true, false],
    [true, true, true]
  ],
  S: [
    [false, true, true],
    [true, true, false]
  ],
  Z: [
    [true, true, false],
    [false, true, true]
  ],
  J: [
    [true, false, false],
    [true, true, true]
  ],
  L: [
    [false, false, true],
    [true, true, true]
  ]
};

import { getAvailableLettersForLevel } from './WordDetector';

export interface TetrisPiece {
  shape: boolean[][];
  letters: string[][];
  x: number;
  y: number;
  type: keyof typeof TETRIS_SHAPES;
}

function getRandomLetterForLevel(level: number): string {
  const availableLetters = getAvailableLettersForLevel(level);
  return availableLetters[Math.floor(Math.random() * availableLetters.length)];
}

export function createRandomPiece(level: number = 1): TetrisPiece {
  const shapeKeys = Object.keys(TETRIS_SHAPES) as Array<keyof typeof TETRIS_SHAPES>;
  const randomShapeKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
  const shape = TETRIS_SHAPES[randomShapeKey];
  
  // Create letters for each block in the shape
  const letters = shape.map(row => 
    row.map(cell => cell ? getRandomLetterForLevel(level) : '')
  );
  
  return {
    shape,
    letters,
    x: Math.floor(10 / 2) - Math.floor(shape[0].length / 2), // Center horizontally
    y: 0,
    type: randomShapeKey
  };
}

export function rotatePiece(piece: TetrisPiece): TetrisPiece {
  const rotatedShape: boolean[][] = [];
  const rotatedLetters: string[][] = [];
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  
  // Rotate 90 degrees clockwise
  for (let col = 0; col < cols; col++) {
    const newRow: boolean[] = [];
    const newLetterRow: string[] = [];
    
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(piece.shape[row][col]);
      newLetterRow.push(piece.letters[row][col]);
    }
    
    rotatedShape.push(newRow);
    rotatedLetters.push(newLetterRow);
  }
  
  return {
    ...piece,
    shape: rotatedShape,
    letters: rotatedLetters
  };
}

export function canPlacePiece(
  piece: TetrisPiece,
  grid: Array<Array<{ letter: string | null; isActive: boolean; isHighlighted: boolean }>>,
  newX?: number,
  newY?: number
): boolean {
  const x = newX !== undefined ? newX : piece.x;
  const y = newY !== undefined ? newY : piece.y;
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const gridRow = y + row;
        const gridCol = x + col;
        
        // Check bounds
        if (gridRow < 0 || gridRow >= grid.length || gridCol < 0 || gridCol >= grid[0].length) {
          return false;
        }
        
        // Check collision with existing pieces
        if (grid[gridRow][gridCol].letter !== null) {
          return false;
        }
      }
    }
  }
  
  return true;
}