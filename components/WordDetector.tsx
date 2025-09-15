interface Cell {
  letter: string | null;
  isActive: boolean;
  isHighlighted: boolean;
}

// Função para normalizar texto (remover acentos)
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

// Conjunto de palavras por categoria de letras
const WORD_POOLS = {
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
const LEVEL_CONFIG = {
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

// Função para obter palavras válidas baseado no nível
export function getValidWordsForLevel(level: number): string[] {
  const config = LEVEL_CONFIG[Math.min(level, 12) as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[12];
  const poolKey = config.pool as keyof typeof WORD_POOLS;
  const availableWords = WORD_POOLS[poolKey];
  
  // Sempre retorna todas as 15 palavras do pool
  return availableWords;
}

// Função para obter quantas palavras são necessárias para passar de nível
export function getRequiredWordsForLevel(level: number): number {
  const config = LEVEL_CONFIG[Math.min(level, 12) as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[12];
  return config.requiredWords;
}

// Função para obter todas as letras únicas das palavras de um nível
export function getAvailableLettersForLevel(level: number): string[] {
  const config = LEVEL_CONFIG[Math.min(level, 12) as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[12];
  const poolKey = config.pool as keyof typeof WORD_POOLS;
  const availableWords = WORD_POOLS[poolKey];
  
  const lettersSet = new Set<string>();
  
  // Pega letras de todas as palavras disponíveis no pool, não apenas as do nível atual
  availableWords.forEach(word => {
    normalizeText(word).split('').forEach(letter => lettersSet.add(letter));
  });
  
  return Array.from(lettersSet).sort();
}

export interface FoundWord {
  word: string;
  positions: Array<{ row: number; col: number }>;
  direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
}

export function findWords(grid: Cell[][], level: number): FoundWord[] {
  const foundWords: FoundWord[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const validWords = getValidWordsForLevel(level);

  // Helper function to check if a word exists starting at a position in a direction
  const checkDirection = (
    startRow: number,
    startCol: number,
    deltaRow: number,
    deltaCol: number,
    direction: FoundWord['direction']
  ) => {
    for (const word of validWords) {
      if (word.length < 3) continue; // Minimum word length
      
      const normalizedWord = normalizeText(word);
      const positions: Array<{ row: number; col: number }> = [];
      let isValid = true;
      let gridWord = '';
      
      for (let i = 0; i < normalizedWord.length; i++) {
        const row = startRow + i * deltaRow;
        const col = startCol + i * deltaCol;
        
        if (
          row < 0 || row >= rows || 
          col < 0 || col >= cols ||
          !grid[row][col].letter
        ) {
          isValid = false;
          break;
        }
        
        const gridLetter = normalizeText(grid[row][col].letter!);
        gridWord += gridLetter;
        positions.push({ row, col });
      }
      
      // Verifica se a palavra formada no grid coincide com a palavra válida (sem acentos)
      if (isValid && gridWord === normalizedWord) {
        foundWords.push({
          word,
          positions,
          direction
        });
      }
    }
  };

  // Todas as 8 direções possíveis
  const directions = [
    { deltaRow: 0, deltaCol: 1, name: 'horizontal' as const },      // esquerda → direita
    { deltaRow: 0, deltaCol: -1, name: 'horizontal' as const },     // direita → esquerda
    { deltaRow: 1, deltaCol: 0, name: 'vertical' as const },        // cima → baixo
    { deltaRow: -1, deltaCol: 0, name: 'vertical' as const },       // baixo → cima
    { deltaRow: 1, deltaCol: 1, name: 'diagonal-down' as const },   // diagonal ↘
    { deltaRow: -1, deltaCol: -1, name: 'diagonal-down' as const }, // diagonal ↖
    { deltaRow: -1, deltaCol: 1, name: 'diagonal-up' as const },    // diagonal ↗
    { deltaRow: 1, deltaCol: -1, name: 'diagonal-up' as const },    // diagonal ↙
  ];

  // Verifica todas as direções de cada posição
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].letter) {
        for (const direction of directions) {
          checkDirection(row, col, direction.deltaRow, direction.deltaCol, direction.name);
        }
      }
    }
  }

  // Remove duplicatas (mesma palavra na mesma posição)
  const uniqueWords = foundWords.filter((word, index, self) => {
    return index === self.findIndex(w => 
      w.word === word.word && 
      JSON.stringify(w.positions) === JSON.stringify(word.positions)
    );
  });

  return uniqueWords;
}

export function highlightWords(grid: Cell[][], words: FoundWord[]): Cell[][] {
  const newGrid = grid.map(row => 
    row.map(cell => ({ ...cell, isHighlighted: false }))
  );

  words.forEach(foundWord => {
    foundWord.positions.forEach(pos => {
      if (pos.row >= 0 && pos.row < newGrid.length && 
          pos.col >= 0 && pos.col < newGrid[0].length) {
        newGrid[pos.row][pos.col].isHighlighted = true;
      }
    });
  });

  return newGrid;
}

export function removeWords(grid: Cell[][], words: FoundWord[]): Cell[][] {
  const newGrid = grid.map(row => 
    row.map(cell => ({ ...cell }))
  );

  words.forEach(foundWord => {
    foundWord.positions.forEach(pos => {
      if (pos.row >= 0 && pos.row < newGrid.length && 
          pos.col >= 0 && pos.col < newGrid[0].length) {
        newGrid[pos.row][pos.col].letter = null;
        newGrid[pos.row][pos.col].isActive = false;
        newGrid[pos.row][pos.col].isHighlighted = false;
      }
    });
  });

  return newGrid;
}