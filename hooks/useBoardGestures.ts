import { useRef } from 'react';
import type { PointerEvent } from 'react';

// Gestos sobre o tabuleiro:
//  - deslizar para os lados: move uma coluna a cada "célula" percorrida
//  - tocar (sem arrastar): gira
//  - arrastar para baixo: acelera (desce uma linha a cada passo)
// O eixo é decidido no início do arrasto, para um gesto não virar outro.

interface GestureActions {
  /** Move a peça; retorna true se ela encaixou (bateu embaixo) */
  move: (dx: number, dy: number) => boolean;
  rotate: () => void;
}

interface GestureState {
  id: number;
  x: number;
  y: number;
  time: number;
  cell: number;
  axis: 'x' | 'down' | 'up' | null;
  stepX: number;
  stepY: number;
  locked: boolean;
}

const DEAD_ZONE = 10; // px até decidir que é arrasto e não toque
const TAP_MAX_MS = 350;

export function useBoardGestures(actions: GestureActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const gesture = useRef<GestureState | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Largura de uma coluna do tabuleiro (10x20 cabendo na área)
    const cell = Math.max(14, Math.min(rect.width, rect.height / 2) / 10);
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY, time: Date.now(), cell,
      axis: null, stepX: 0, stepY: 0, locked: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (!g.axis) {
      if (Math.hypot(dx, dy) < DEAD_ZONE) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : dy > 0 ? 'down' : 'up';
    }

    const { move } = actionsRef.current;
    if (g.axis === 'x') {
      const steps = Math.trunc(dx / (g.cell * 0.9));
      while (g.stepX < steps) { move(1, 0); g.stepX++; }
      while (g.stepX > steps) { move(-1, 0); g.stepX--; }
    } else if (g.axis === 'down' && !g.locked) {
      const steps = Math.trunc(dy / (g.cell * 0.6));
      while (g.stepY < steps) {
        g.stepY++;
        // Encaixou: o resto do arrasto não empurra a próxima peça
        if (move(0, 1)) { g.locked = true; break; }
      }
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    if (!g.axis && Date.now() - g.time < TAP_MAX_MS) {
      actionsRef.current.rotate();
    }
    gesture.current = null;
  };

  const onPointerCancel = () => {
    gesture.current = null;
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
