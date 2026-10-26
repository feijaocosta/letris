// Números de velocidade e pontuação do LETRIS, num lugar só para ajustar
// depois de jogar. As palavras e a progressão de níveis ficam em
// data/words.json.

export const SPEED = {
  /** Tempo (ms) para a peça descer uma linha no nível 1 */
  initialMs: 1000,
  /** Quanto cada nível acelera (ms a menos por linha) */
  perLevelMs: 60,
  /** Dentro do nível: a cada `timeStepMs` jogados, acelera `perStepMs` */
  timeStepMs: 30_000,
  perStepMs: 20,
  /** Máximo que o tempo acelera dentro de um nível (zera no nível seguinte) */
  maxTimeReductionMs: 100,
  /** Nunca mais rápido que isto */
  minMs: 250,
};

export const SCORING = {
  /** Palavra nova, por tamanho (6 ou mais usa o valor de 6) */
  wordByLength: { 3: 100, 4: 150, 5: 220, 6: 300 } as Record<number, number>,
  /** Palavra já formada antes no mesmo nível */
  repeatedWordFactor: 0.5,
  /** Várias palavras na mesma jogada: [2 palavras, 3 ou mais] */
  multiWordFactor: [1.5, 2],
  /** Palavra/linha que se forma sozinha depois de uma limpeza (cascata): +50% */
  cascadeBonus: 0.5,
  /** Palavra e linha na mesma jogada: +50% */
  wordAndLineBonus: 0.5,
  /** Linhas completas de uma vez: [0, 1, 2, 3, 4+] */
  lines: [0, 50, 120, 250, 500],
  /** Soltar a peça (botão vermelho/espaço): pontos por linha que ela cai */
  hardDropPerRow: 1,
  /** Concluir o nível: valor × número do nível */
  levelCompletePerLevel: 300,
  /** Multiplicador do nível: 1 + perLevel × (nível − 1) */
  levelMultiplierPerLevel: 0.2,
  /** Letras que vêm das palavras que faltam na lista (o resto vem de todas as letras do nível) */
  targetLetterChance: 0.6,
  /** Depois de tantas consoantes seguidas, a próxima letra é vogal */
  maxConsonantsInARow: 3,
};
