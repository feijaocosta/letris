import { WordLibrary } from './WordLibrary';
import type { TileColor } from './LetrisUI';

export interface TetrisPiece {
  shape: boolean[][];
  letters: string[][];
  color: TileColor;
  x: number;
  y: number;
}

// Cor de cada formato, na mesma ordem de TETRIS_SHAPES
const SHAPE_COLORS: TileColor[] = ['blue', 'yellow', 'red', 'green', 'orange', 'blue', 'orange'];

// Formas das peças do Tetris
const TETRIS_SHAPES = [
  // I-piece (linha)
  [
    [true, true, true, true]
  ],
  // O-piece (quadrado)
  [
    [true, true],
    [true, true]
  ],
  // T-piece
  [
    [false, true, false],
    [true, true, true]
  ],
  // S-piece
  [
    [false, true, true],
    [true, true, false]
  ],
  // Z-piece
  [
    [true, true, false],
    [false, true, true]
  ],
  // J-piece
  [
    [true, false, false],
    [true, true, true]
  ],
  // L-piece
  [
    [false, false, true],
    [true, true, true]
  ]
];

function getRandomLetter(level: number): string {
  return WordLibrary.getRandomLetterForLevel(level);
}

export function createRandomPiece(level: number = 1): TetrisPiece {
  const randomIndex = Math.floor(Math.random() * TETRIS_SHAPES.length);
  const shape = TETRIS_SHAPES[randomIndex];
  
  // Create letters for each block in the shape
  const letters = shape.map(row => 
    row.map(cell => cell ? getRandomLetter(level) : '')
  );
  
  return {
    shape,
    letters,
    color: SHAPE_COLORS[randomIndex],
    x: Math.floor((10 - shape[0].length) / 2), // Center horizontally on a 10-wide grid
    y: 0
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
  grid: Array<Array<{ letter: string | null }>>,
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