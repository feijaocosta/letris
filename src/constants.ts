// src/constants.ts

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 18;
export const INITIAL_FALL_SPEED = 1000; // milliseconds

// Conjunto de palavras por categoria de letras
export const WORD_POOLS = {
  // Pool 1: 10 letras básicas (A, E, I, O, U, M, S, R, L, T)
  pool1: [
    'SOL', 'LUA', 'MAR', 'CEU', 'MEL', 'SAL', 'SIM', 'LEI', 'REI', 'MAS', 'SER', 'TER', 'LER', 'MIL', 'MIO'
  ],
  // Pool 2: 15 letras (anteriores + N, C, P, D, V)  
  pool2: [
    'CASA', 'VIDA', 'MESA', 'VELA', 'NEVE', 'PENA', 'TELA', 'SEDE', 'REDE', 'CADA', 'TUDO', 'NADA', 'DAMA', 'PATO', 'CAMA'
  ],
  // Pool 3: 20 letras (anteriores + G, F, B, H, Q)
  pool3: [
    'BOLA', 'FOGO', 'GATO', 'HORA', 'QUAL', 'GELO', 'FADA', 'BELA', 'FOME', 'DOCE', 'GOTA', 'FOCA', 'BODE', 'BIFE', 'BEBE'
  ],
  // Pool 4: 25 letras (anteriores + J, K, W, X, Y)
  pool4: [
    'JOGO', 'JOIA', 'BAJA', 'YOGA', 'JEEP', 'JAVA', 'JAZZ', 'AJAX', 'LUXO', 'EXPO', 'SEXY', 'OXID', 'YOGI', 'AXEL', 'JOAO'
  ]
};

// Sistema de níveis baseado na quantidade de palavras necessárias para passar de nível
export const LEVEL_CONFIG = {
  // Níveis 1-3: Pool 1 (10 letras) - sempre 15 palavras, mas X necessárias para passar
  1: { pool: 'pool1', requiredWords: 5, totalAvailable: 15 },
  2: { pool: 'pool1', requiredWords: 8, totalAvailable: 15 },
  3: { pool: 'pool1', requiredWords: 15, totalAvailable: 15 },
  
  // Níveis 4-6: Pool 2 (15 letras)
  4: { pool: 'pool2', requiredWords: 5, totalAvailable: 15 },
  5: { pool: 'pool2', requiredWords: 8, totalAvailable: 15 },
  6: { pool: 'pool2', requiredWords: 15, totalAvailable: 15 },
  
  // Níveis 7-9: Pool 3 (20 letras)
  7: { pool: 'pool3', requiredWords: 5, totalAvailable: 15 },
  8: { pool: 'pool3', requiredWords: 8, totalAvailable: 15 },
  9: { pool: 'pool3', requiredWords: 15, totalAvailable: 15 },
  
  // Níveis 10+: Pool 4 (25 letras)
  10: { pool: 'pool4', requiredWords: 5, totalAvailable: 15 },
  11: { pool: 'pool4', requiredWords: 8, totalAvailable: 15 },
  12: { pool: 'pool4', requiredWords: 15, totalAvailable: 15 },
};