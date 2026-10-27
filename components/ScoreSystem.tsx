// Sistema de Pontuação do LETRIS
// Centraliza a lógica de pontos e velocidade; os números ficam em config/gameplay.ts

import { SCORING, SPEED } from '../config/gameplay';

export interface ScoredWord {
  word: string;
  /** Já tinha sido formada neste nível */
  repeated: boolean;
}

export interface ClearResult {
  points: number;
  /** Rótulos para o aviso na tela ("Combo ×1,5", "Cascata"...) */
  labels: string[];
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

export class ScoreSystem {
  static levelMultiplier(level: number): number {
    return 1 + SCORING.levelMultiplierPerLevel * (level - 1);
  }

  static wordValue(word: string): number {
    const len = Math.min(word.length, 6);
    return SCORING.wordByLength[len] ?? SCORING.wordByLength[6];
  }

  /**
   * Pontos de uma rodada de limpeza (palavras e linhas eliminadas juntas).
   */
  static scoreClear(words: ScoredWord[], lines: number, level: number, cascade: boolean): ClearResult {
    const labels: string[] = [];

    let wordPoints = words.reduce(
      (sum, w) => sum + ScoreSystem.wordValue(w.word) * (w.repeated ? SCORING.repeatedWordFactor : 1),
      0,
    );
    if (words.length >= 2) {
      const factor = SCORING.multiWordFactor[Math.min(words.length, 3) - 2];
      wordPoints *= factor;
      labels.push(`Combo ×${fmt(factor)}`);
    }
    if (words.some(w => w.repeated)) labels.push('Repetida');

    const linePoints = lines > 0 ? SCORING.lines[Math.min(lines, SCORING.lines.length - 1)] : 0;
    if (lines > 0) labels.push(['', 'Linha!', 'Duplo!', 'Triplo!', 'TETRIS!'][Math.min(lines, 4)]);

    let total = wordPoints + linePoints;
    if (words.length > 0 && lines > 0) {
      total *= 1 + SCORING.wordAndLineBonus;
      labels.push('Palavra + linha');
    }
    if (cascade) {
      total *= 1 + SCORING.cascadeBonus;
      labels.push('Cascata');
    }

    return { points: Math.round(total * ScoreSystem.levelMultiplier(level)), labels };
  }

  static hardDropPoints(rows: number): number {
    return rows * SCORING.hardDropPerRow;
  }

  static levelCompletePoints(level: number): number {
    return SCORING.levelCompletePerLevel * level;
  }

  /**
   * Tempo (ms) para a peça descer uma linha. `levelPlayedMs` é o tempo
   * jogado no nível atual (sem pausas); zera a cada nível.
   */
  static calculateFallSpeed(level: number, levelPlayedMs: number): number {
    const levelReduction = (level - 1) * SPEED.perLevelMs;
    const timeReduction = Math.min(
      SPEED.maxTimeReductionMs,
      Math.floor(levelPlayedMs / SPEED.timeStepMs) * SPEED.perStepMs,
    );
    return Math.max(SPEED.initialMs - levelReduction - timeReduction, SPEED.minMs);
  }
}
