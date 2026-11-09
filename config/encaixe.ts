// Modo Encaixe: o jogador arrasta peças da bandeja e solta onde quiser no
// tabuleiro (sem gravidade). Linha ou coluna completa some; palavras e fases
// seguem as regras do Clássico. Números para ajustar depois de jogar.

export const ENCAIXE = {
  /** Tabuleiro: colunas × linhas (levemente retangular) */
  cols: 8,
  rows: 10,
  /** Peças na bandeja (cada uma é reposta assim que é usada) */
  traySize: 3,
  /** Pontos por bloco encaixado (no Clássico, soltar dá pontos por linha que cai) */
  pointsPerBlock: 1,
  /** Girar a peça (tocando nela na bandeja). Desligado para testar sem */
  allowRotate: false,
  /** Quanto a peça arrastada fica acima do dedo (px), para o dedo não cobrir */
  dragLift: 56,
  /** Duração do brilho antes de palavras/linhas/colunas sumirem (ms) */
  clearMs: 600,
};

/**
 * Formatos das peças (sem girar, cada orientação é uma peça): "#" = bloco.
 * Peso maior = aparece mais. Inclui as do Tetris e as de 2×2 e 2×3.
 */
export const ENCAIXE_SHAPES: Array<{ rows: string[]; weight: number }> = [
  { rows: ['#'], weight: 3 },
  { rows: ['##'], weight: 3 },
  { rows: ['#', '#'], weight: 3 },
  { rows: ['###'], weight: 3 },
  { rows: ['#', '#', '#'], weight: 3 },
  { rows: ['##', '#.'], weight: 2 },
  { rows: ['##', '.#'], weight: 2 },
  { rows: ['#.', '##'], weight: 2 },
  { rows: ['.#', '##'], weight: 2 },
  { rows: ['####'], weight: 2 },
  { rows: ['#', '#', '#', '#'], weight: 2 },
  { rows: ['##', '##'], weight: 3 },
  { rows: ['###', '.#.'], weight: 1 },
  { rows: ['.#.', '###'], weight: 1 },
  { rows: ['#.', '##', '#.'], weight: 1 },
  { rows: ['.#', '##', '.#'], weight: 1 },
  { rows: ['.##', '##.'], weight: 1 },
  { rows: ['##.', '.##'], weight: 1 },
  { rows: ['#.', '##', '.#'], weight: 1 },
  { rows: ['.#', '##', '#.'], weight: 1 },
  { rows: ['#..', '###'], weight: 1 },
  { rows: ['..#', '###'], weight: 1 },
  { rows: ['###', '#..'], weight: 1 },
  { rows: ['###', '..#'], weight: 1 },
  { rows: ['##', '#.', '#.'], weight: 1 },
  { rows: ['##', '.#', '.#'], weight: 1 },
  { rows: ['#.', '#.', '##'], weight: 1 },
  { rows: ['.#', '.#', '##'], weight: 1 },
  { rows: ['###', '###'], weight: 1 },
  { rows: ['##', '##', '##'], weight: 1 },
];
