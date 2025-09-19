// src/types.ts

export interface Cell {
    letter: string | null;
    isActive: boolean;
    isHighlighted: boolean;
  }
  
  export interface TetrisPiece {
    shape: boolean[][];
    letters: string[][];
    x: number;
    y: number;
    type: string;
  }
  
  export interface FoundWord {
    word: string;
    positions: Array<{ row: number; col: number }>;
    direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
  }