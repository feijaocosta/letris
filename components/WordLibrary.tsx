// Biblioteca de Palavras do LETRIS
// Banco de palavras, progressão de níveis e geração de letras de UM idioma.
// Os dados ficam em data/words/<idioma>.json (validados por
// scripts/check-words.mjs) e são carregados por lib/wordBanks.ts.

import { SCORING } from '../config/gameplay';
import type { LanguageConfig } from '../config/languages';

export interface WordBankData {
  levels: Array<{
    /** Grupo de níveis (chave traduzida em "pools.*" nos locales) */
    name: string;
    addLetters: string;
    mix: Record<string, number>;
    goal: number;
  }>;
  words: Record<string, string[]>;
}

export interface LevelConfig {
  name: string;
  letters: string[];
  /** Quantas palavras de cada tamanho entram na lista sorteada */
  mix: Record<number, number>;
  goal: number;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class WordLibrary {
  readonly lang: LanguageConfig;
  private readonly levels: LevelConfig[];
  private readonly allWords: string[];
  private readonly vowels: Set<string>;
  /** Vogais + letras que quebram a sequência de consoantes (Y em inglês) */
  private readonly runBreakers: Set<string>;

  constructor(data: WordBankData, lang: LanguageConfig) {
    this.lang = lang;
    this.vowels = new Set(lang.vowels);
    this.runBreakers = new Set(lang.vowels + (lang.extraVowels ?? ''));
    // Letras acumuladas: cada nível herda as do anterior. Array.from separa
    // por caractere de verdade (Ñ é um só).
    const letters: string[] = [];
    this.levels = data.levels.map(level => {
      for (const l of Array.from(level.addLetters)) if (!letters.includes(l)) letters.push(l);
      const mix: Record<number, number> = {};
      for (const [len, count] of Object.entries(level.mix)) mix[Number(len)] = count;
      return { name: level.name, letters: [...letters], mix, goal: level.goal };
    });
    this.allWords = Object.values(data.words).flat();
  }

  /** Nível 10 em diante usa a última configuração */
  getLevelConfig(level: number): LevelConfig {
    return this.levels[Math.min(Math.max(level, 1), this.levels.length) - 1];
  }

  getAvailableLettersForLevel(level: number): string[] {
    return this.getLevelConfig(level).letters;
  }

  getRequiredWordsForLevel(level: number): number {
    return this.getLevelConfig(level).goal;
  }

  getPoolNameForLevel(level: number): string {
    return this.getLevelConfig(level).name;
  }

  /** Todas as palavras do banco que dá para formar com as letras do nível. */
  getBankForLevel(level: number): Set<string> {
    const letters = new Set(this.getAvailableLettersForLevel(level));
    return new Set(this.allWords.filter(w => Array.from(w).every(c => letters.has(c))));
  }

  /**
   * Sorteia a lista de palavras do nível conforme o `mix` (tamanhos),
   * evitando as já usadas na partida. Se faltar palavra inédita, repete.
   */
  drawWordsForLevel(level: number, used: Set<string>): string[] {
    const { mix } = this.getLevelConfig(level);
    const bank = [...this.getBankForLevel(level)];
    const picked: string[] = [];
    for (const [len, count] of Object.entries(mix)) {
      const ofLength = bank.filter(w => Array.from(w).length === Number(len));
      const fresh = shuffle(ofLength.filter(w => !used.has(w)));
      const old = shuffle(ofLength.filter(w => used.has(w)));
      picked.push(...[...fresh, ...old].slice(0, count));
    }
    // Exibição: menores primeiro, depois na ordem alfabética do idioma
    return picked.sort((a, b) => a.length - b.length || a.localeCompare(b, this.lang.locale));
  }

  /**
   * Gerador de letras do nível: parte das letras vem das palavras que
   * ainda faltam (na proporção em que aparecem nelas), o resto de todas as
   * letras do nível, sem deixar faltar vogal por muito tempo.
   */
  createLetterGenerator(level: number, remainingWords: () => string[]): () => string {
    const letters = this.getAvailableLettersForLevel(level);
    const vowels = letters.filter(l => this.vowels.has(l));
    let consonantsInARow = 0;
    const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

    return () => {
      let letter: string;
      if (consonantsInARow >= SCORING.maxConsonantsInARow) {
        letter = pick(vowels);
      } else {
        const targetLetters = remainingWords().flatMap(w => Array.from(w));
        letter = targetLetters.length > 0 && Math.random() < SCORING.targetLetterChance
          ? pick(targetLetters)
          : pick(letters);
      }
      consonantsInARow = this.runBreakers.has(letter) ? 0 : consonantsInARow + 1;
      return letter;
    };
  }
}
