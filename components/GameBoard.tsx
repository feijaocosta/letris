import React from 'react';

interface Cell {
  letter: string | null;
  isActive: boolean;
  isHighlighted: boolean;
}

interface GameBoardProps {
  grid: Cell[][];
  activePiece: {
    shape: boolean[][];
    letters: string[][];
    x: number;
    y: number;
  } | null;
  linesToClear?: number[];
}

export function GameBoard({ grid, activePiece, linesToClear = [] }: GameBoardProps) {
  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    let letter = cell.letter;
    let isActive = cell.isActive;
    let isHighlighted = cell.isHighlighted;
    const isLineToClear = linesToClear.includes(rowIndex);

    // Check if this position has an active piece
    if (activePiece) {
      const pieceRow = rowIndex - activePiece.y;
      const pieceCol = colIndex - activePiece.x;
      
      if (
        pieceRow >= 0 && pieceRow < activePiece.shape.length &&
        pieceCol >= 0 && pieceCol < activePiece.shape[0].length &&
        activePiece.shape[pieceRow][pieceCol]
      ) {
        letter = activePiece.letters[pieceRow][pieceCol];
        isActive = true;
      }
    }

    return (
      <div
        key={`${rowIndex}-${colIndex}`}
        className={`
          w-6 h-6 border border-gray-300 flex items-center justify-center text-xs font-bold
          ${isActive ? 'bg-blue-200 border-blue-400' : ''}
          ${isHighlighted ? 'bg-yellow-200 border-yellow-400' : ''}
          ${isLineToClear ? 'bg-yellow-300 border-yellow-500 animate-pulse' : ''}
          ${letter && !isActive && !isHighlighted && !isLineToClear ? 'bg-gray-100' : ''}
          ${!letter && !isActive && !isLineToClear ? 'bg-slate-800 bg-opacity-50' : ''}
        `}
      >
        {letter && (
          <span className="font-bold text-gray-800">
            {letter}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="inline-block border-2 border-slate-600 bg-slate-900 bg-opacity-70 p-1 rounded">
      <div className="grid grid-cols-10 gap-0">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>
    </div>
  );
}