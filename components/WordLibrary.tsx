// Biblioteca de Palavras do LETRIS
// Centraliza toda a lógica de palavras, pools de letras e validação

export interface WordPool {
  level: number;
  name: string;
  letters: string[];
  words: string[];
  requiredWords: number;
}

export class WordLibrary {
  // Pools de letras por dificuldade
  private static readonly LETTER_POOLS: WordPool[] = [
    {
      level: 1,
      name: "Básico",
      letters: ['A', 'E', 'I', 'O', 'U', 'C', 'L', 'M', 'R', 'S', 'T'],
      words: [
        'SOL', 'LUA', 'MAR', 'COR', 'LEI', 'REI', 'SAL',
        'CAMA', 'AMAR', 'MEU', 'TUA'
      ],
      requiredWords: 5
    },
    {
      level: 2,
      name: "Intermediário", 
      letters: ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'N', 'L', 'M', 'D', 'C', 'P', 'B'],
      words: [
        'CASA', 'MESA', 'PATO', 'BOLA', 'REDE', 'SEDE', 'DADO', 'CAMA', 
        'DAMA', 'CABO', 'SABE', 'PODE', 'TODO', 'LADO', 'MODO'
      ],
      requiredWords: 8
    },
    {
      level: 3,
      name: "Avançado",
      letters: ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'N', 'L', 'M', 'D', 'C', 'P', 'B', 'G', 'V', 'F', 'H', 'J'],
      words: [
        'FOGO', 'GATO', 'VIDA', 'HORA', 'CAMPO', 'GRAVE', 'FUNDO', 'VERDE', 
        'JOGOS', 'HAVER', 'FUGIR', 'PEDRA', 'BRAVO', 'CALOR', 'VALOR'
      ],
      requiredWords: 12
    },
    {
      level: 4,
      name: "Expert",
      letters: ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'N', 'L', 'M', 'D', 'C', 'P', 'B', 'G', 'V', 'F', 'H', 'J', 'Q', 'W', 'X', 'Y', 'Z'],
      words: [
        'QUERO', 'ZEBRA', 'YOGA', 'WAFER', 'XEROX', 'ZUMBI', 'WYNNE', 'XISTO', 
        'QUOTA', 'ZONAS', 'WALTZ', 'QUALM', 'JAZZY', 'NEXUS', 'FUZZY'
      ],
      requiredWords: 15
    }
  ];

  /**
   * Obtém o pool de letras baseado no nível
   */
  static getPoolForLevel(level: number): WordPool {
    if (level <= 3) return this.LETTER_POOLS[0];
    if (level <= 6) return this.LETTER_POOLS[1]; 
    if (level <= 9) return this.LETTER_POOLS[2];
    return this.LETTER_POOLS[3];
  }

  /**
   * Obtém letras disponíveis para um nível
   */
  static getAvailableLettersForLevel(level: number): string[] {
    return this.getPoolForLevel(level).letters;
  }

  /**
   * Obtém palavras válidas para um nível
   */
  static getValidWordsForLevel(level: number): string[] {
    return this.getPoolForLevel(level).words;
  }

  /**
   * Obtém palavras necessárias para avançar de nível
   */
  static getRequiredWordsForLevel(level: number): number {
    return this.getPoolForLevel(level).requiredWords;
  }

  /**
   * Obtém nome do pool para um nível
   */
  static getPoolNameForLevel(level: number): string {
    return this.getPoolForLevel(level).name;
  }

  /**
   * Gera letra aleatória baseada no nível
   */
  static getRandomLetterForLevel(level: number): string {
    const letters = this.getAvailableLettersForLevel(level);
    return letters[Math.floor(Math.random() * letters.length)];
  }

  /**
   * Verifica se uma palavra é válida para o nível
   */
  static isValidWordForLevel(word: string, level: number): boolean {
    const validWords = this.getValidWordsForLevel(level);
    return validWords.includes(word.toUpperCase());
  }

  /**
   * Remove acentos de uma palavra para comparação
   */
  static normalizeWord(word: string): string {
    return word
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  }

  /**
   * Verifica se uma palavra normalizada é válida
   */
  static isValidNormalizedWord(word: string, level: number): boolean {
    const normalizedWord = this.normalizeWord(word);
    const validWords = this.getValidWordsForLevel(level).map(w => this.normalizeWord(w));
    return validWords.includes(normalizedWord);
  }

  /**
   * Obtém estatísticas do pool
   */
  static getPoolStats(level: number) {
    const pool = this.getPoolForLevel(level);
    return {
      level: pool.level,
      name: pool.name,
      letterCount: pool.letters.length,
      wordCount: pool.words.length,
      requiredWords: pool.requiredWords,
      letters: pool.letters.slice(0, 10), // Primeiras 10 para display
      hasMore: pool.letters.length > 10
    };
  }

  /**
   * Obtém todas as palavras de todos os níveis (para debug)
   */
  static getAllWords(): string[] {
    return this.LETTER_POOLS.flatMap(pool => pool.words);
  }

  /**
   * Valida se o pool de um nível está bem formado
   */
  static validatePool(level: number): boolean {
    const pool = this.getPoolForLevel(level);
    
    // Verifica se todas as palavras podem ser formadas com as letras disponíveis
    return pool.words.every(word => {
      const wordLetters = word.split('');
      return wordLetters.every(letter => pool.letters.includes(letter));
    });
  }
}