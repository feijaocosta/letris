import { useLayoutEffect, useRef, useState } from 'react';
import type { TetrisPiece } from './TetrisPieces';
import { tileVars, type TileColor } from './LetrisUI';

export interface Cell {
  letter: string | null;
  color: TileColor | null;
  isActive: boolean;
  isHighlighted: boolean;
}

interface GameBoardProps {
  grid: Cell[][];
  activePiece: TetrisPiece | null;
  /** Linha onde a peça ativa vai parar (contorno tracejado) */
  ghostY?: number | null;
  linesToClear?: number[];
}

const pieceCellAt = (piece: TetrisPiece, y: number, row: number, col: number) => {
  const r = row - y;
  const c = col - piece.x;
  return r >= 0 && r < piece.shape.length && c >= 0 && c < piece.shape[0].length && piece.shape[r][c];
};

export function GameBoard({ grid, activePiece, ghostY = null, linesToClear = [] }: GameBoardProps) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });

  // Mede a área disponível em px. Antes usávamos container queries (cqw/cqh),
  // mas o Safari do iPhone às vezes não atualiza o cqh quando a área encolhe
  // (ex.: a lista de palavras ganha uma linha) e o tabuleiro ficava por cima.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setArea(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const boardWidth = Math.floor(Math.min(area.width, (area.height * cols) / rows));
  const boardHeight = (boardWidth * rows) / cols;
  // Largura interna: tira a borda (2px) e o padding (4px) dos dois lados
  const innerWidth = Math.max(0, boardWidth - 12);

  const renderCell = (cell: Cell, row: number, col: number) => {
    const key = `${row}-${col}`;

    if (activePiece && pieceCellAt(activePiece, activePiece.y, row, col)) {
      const letter = activePiece.letters[row - activePiece.y][col - activePiece.x];
      return <div key={key} className="tile min-w-0 min-h-0" style={tileVars(activePiece.color)}>{letter}</div>;
    }

    if (cell.letter) {
      const effect = cell.isHighlighted ? 'tile-glow' : linesToClear.includes(row) ? 'tile-flash' : '';
      return (
        <div key={key} className={`tile min-w-0 min-h-0 ${effect}`} style={tileVars(cell.color ?? 'blue')}>
          {cell.letter}
        </div>
      );
    }

    if (activePiece && ghostY !== null && ghostY !== activePiece.y && pieceCellAt(activePiece, ghostY, row, col)) {
      return <div key={key} className="min-w-0 min-h-0 rounded-[22%] border-2 border-dashed border-white/40" />;
    }

    return <div key={key} className="min-w-0 min-h-0 rounded-[22%] bg-white/5" />;
  };

  // O tabuleiro ocupa todo o espaço disponível mantendo a proporção
  // colunas x linhas (10x20).
  return (
    <div ref={areaRef} className="w-full h-full min-h-0 flex justify-center overflow-hidden">
      <div
        className="bg-deep border-2 border-line rounded-2xl p-1"
        style={{ width: boardWidth, height: boardHeight, visibility: boardWidth > 0 ? 'visible' : 'hidden' }}
      >
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gap: innerWidth * 0.008,
            fontSize: (innerWidth * 0.58) / cols,
          }}
        >
          {grid.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
        </div>
      </div>
    </div>
  );
}
