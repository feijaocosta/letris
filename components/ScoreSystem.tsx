// Sistema de Pontuação do LETRIS
// Centraliza toda a lógica de pontos, níveis e progressão

export interface ScoreCalculation {
  points: number;
  reason: string;
}

export class ScoreSystem {
  // Pontos base por ações
  static readonly WORD_BASE_POINTS = 100;
  static readonly LINE_CLEAR_POINTS = [0, 40, 100, 300, 1200]; // Tetris tradicional
  static readonly LEVEL_MULTIPLIER = 1;

  // Sistema de níveis e velocidade
  static readonly INITIAL_FALL_SPEED = 1000; // ms
  static readonly SPEED_INCREASE_PER_LEVEL = 100; // ms menos por nível
  static readonly MIN_FALL_SPEED = 100; // ms mínimo
  static readonly TIME_ACCELERATION = 30000; // 30s para acelerar
  static readonly TIME_SPEED_REDUCTION = 50; // ms reduzidos a cada intervalo

  /**
   * Calcula pontos por palavras encontradas
   */
  static calculateWordPoints(wordsCount: number, level: number): ScoreCalculation {
    const basePoints = wordsCount * this.WORD_BASE_POINTS;
    const points = basePoints * level;
    
    return {
      points,
      reason: `${wordsCount} palavra(s) × ${this.WORD_BASE_POINTS} × nível ${level}`
    };
  }

  /**
   * Calcula pontos por linhas eliminadas
   */
  static calculateLinePoints(linesCount: number, level: number): ScoreCalculation {
    const basePoints = this.LINE_CLEAR_POINTS[Math.min(linesCount, 4)] || 0;
    const points = basePoints * level;
    
    const lineNames = ['', 'Linha!', 'Duplo!', 'Triplo!', 'TETRIS!'];
    const reason = `${lineNames[linesCount]} - ${basePoints} × nível ${level}`;
    
    return {
      points,
      reason
    };
  }

  /**
   * Calcula velocidade de queda baseada no nível e tempo
   */
  static calculateFallSpeed(level: number, gameTime: number): number {
    // Redução por nível
    const levelReduction = (level - 1) * this.SPEED_INCREASE_PER_LEVEL;
    
    // Redução por tempo (acelera a cada 30 segundos)
    const timeIntervals = Math.floor(gameTime / this.TIME_ACCELERATION);
    const timeReduction = timeIntervals * this.TIME_SPEED_REDUCTION;
    
    // Velocidade final
    const finalSpeed = this.INITIAL_FALL_SPEED - levelReduction - timeReduction;
    
    // Não pode ser menor que o mínimo
    return Math.max(finalSpeed, this.MIN_FALL_SPEED);
  }

  /**
   * Retorna o número de palavras necessárias para avançar de nível
   */
  static getRequiredWordsForLevel(level: number): number {
    if (level <= 3) return 5;   // Níveis 1-3: 5 palavras
    if (level <= 6) return 8;   // Níveis 4-6: 8 palavras  
    if (level <= 9) return 12;  // Níveis 7-9: 12 palavras
    return 15;                  // Nível 10+: 15 palavras
  }

  /**
   * Calcula bônus de pontos por velocidade
   */
  static calculateSpeedBonus(fallSpeed: number): number {
    // Quanto mais rápido, maior o bônus
    const speedRatio = this.INITIAL_FALL_SPEED / fallSpeed;
    return Math.floor(speedRatio * 10); // 10 pontos por unidade de velocidade
  }

  /**
   * Formata pontuação para display
   */
  static formatScore(score: number): string {
    return score.toLocaleString('pt-BR');
  }

  /**
   * Calcula estatísticas do jogo
   */
  static calculateGameStats(score: number, level: number, wordsFound: number, linesCleared: number) {
    return {
      score: this.formatScore(score),
      level,
      wordsFound,
      linesCleared,
      avgPointsPerWord: wordsFound > 0 ? Math.round(score / wordsFound) : 0,
      avgPointsPerLine: linesCleared > 0 ? Math.round(score / linesCleared) : 0
    };
  }
}