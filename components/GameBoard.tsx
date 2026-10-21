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
          min-w-0 min-h-0 border flex items-center justify-center font-bold leading-none
          ${isActive ? 'bg-blue-200 border-blue-400' : ''}
          ${isHighlighted ? 'bg-yellow-200 border-yellow-400' : ''}
          ${isLineToClear ? 'bg-yellow-300 border-yellow-500 animate-pulse' : ''}
          ${letter && !isActive && !isHighlighted && !isLineToClear ? 'bg-gray-100 border-gray-300' : ''}
          ${!letter && !isActive && !isLineToClear ? 'bg-slate-800/50 border-slate-700/60' : ''}
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

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // O tabuleiro ocupa todo o espaço disponível mantendo a proporção
  // colunas x linhas (10x20). Unidades cq* vêm do container abaixo.
  return (
    <div className="w-full h-full min-h-0 flex justify-center" style={{ containerType: 'size' }}>
      <div
        className="border-2 border-slate-600 bg-slate-900/70 p-1 rounded"
        style={{
          width: `min(100cqw, ${(cols / rows) * 100}cqh)`,
          aspectRatio: `${cols} / ${rows}`,
          containerType: 'inline-size',
        }}
      >
      <div
        className="grid gap-0 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          fontSize: `${55 / cols}cqw`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>
      </div>
    </div>
  );
}