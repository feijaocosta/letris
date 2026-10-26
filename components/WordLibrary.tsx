// Biblioteca de Palavras do LETRIS
// Banco de palavras, progressão de níveis e geração de letras.
// Os dados ficam em data/words.json (validado por scripts/check-words.mjs).

import data from '../data/words.json';
import { SCORING } from '../config/gameplay';

interface LevelData {
  name: string;
  addLetters: string;
  mix: Record<string, number>;
  goal: number;
}

export interface LevelConfig {
  name: string;
  letters: string[];
  /** Quantas palavras de cada tamanho entram na lista sorteada */
  mix: Record<number, number>;
  goal: number;
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Letras acumuladas: cada nível herda as do anterior
const LEVELS: LevelConfig[] = (() => {
  const letters: string[] = [];
  return (data.levels as LevelData[]).map(level => {
    for (const l of level.addLetters) if (!letters.includes(l)) letters.push(l);
    const mix: Record<number, number> = {};
    for (const [len, count] of Object.entries(level.mix)) mix[Number(len)] = count;
    return { name: level.name, letters: [...letters], mix, goal: level.goal };
  });
})();

const ALL_WORDS: string[] = Object.values(data.words as Record<string, string[]>).flat();

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class WordLibrary {
  /** Nível 10 em diante usa a última configuração */
  static getLevelConfig(level: number): LevelConfig {
    return LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1];
  }

  static getAvailableLettersForLevel(level: number): string[] {
    return this.getLevelConfig(level).letters;
  }

  static getRequiredWordsForLevel(level: number): number {
    return this.getLevelConfig(level).goal;
  }

  static getPoolNameForLevel(level: number): string {
    return this.getLevelConfig(level).name;
  }

  /**
   * Todas as palavras do banco que dá para formar com as letras do nível.
   * As que não estão na lista sorteada valem como "bônus" (só pontos).
   */
  static getBankForLevel(level: number): Set<string> {
    const letters = new Set(this.getAvailableLettersForLevel(level));
    return new Set(ALL_WORDS.filter(w => [...w].every(c => letters.has(c))));
  }

  /**
   * Sorteia a lista de palavras do nível conforme o `mix` (tamanhos),
   * evitando as já usadas na partida. Se faltar palavra inédita, repete.
   */
  static drawWordsForLevel(level: number, used: Set<string>): string[] {
    const { mix } = this.getLevelConfig(level);
    const bank = [...this.getBankForLevel(level)];
    const picked: string[] = [];
    for (const [len, count] of Object.entries(mix)) {
      const ofLength = bank.filter(w => w.length === Number(len));
      const fresh = shuffle(ofLength.filter(w => !used.has(w)));
      const old = shuffle(ofLength.filter(w => used.has(w)));
      picked.push(...[...fresh, ...old].slice(0, count));
    }
    // Exibição: menores primeiro, depois alfabética
    return picked.sort((a, b) => a.length - b.length || a.localeCompare(b));
  }

  /**
   * Gerador de letras do nível: parte das letras vem das palavras que
   * ainda faltam (na proporção em que aparecem nelas), o resto de todas as
   * letras do nível, sem deixar faltar vogal por muito tempo.
   */
  static createLetterGenerator(level: number, remainingWords: () => string[]): () => string {
    const letters = this.getAvailableLettersForLevel(level);
    const vowels = letters.filter(l => VOWELS.has(l));
    let consonantsInARow = 0;

    return () => {
      let letter: string;
      if (consonantsInARow >= SCORING.maxConsonantsInARow) {
        letter = vowels[Math.floor(Math.random() * vowels.length)];
      } else {
        const targetLetters = remainingWords().join('');
        letter = targetLetters && Math.random() < SCORING.targetLetterChance
          ? targetLetters[Math.floor(Math.random() * targetLetters.length)]
          : letters[Math.floor(Math.random() * letters.length)];
      }
      consonantsInARow = VOWELS.has(letter) ? 0 : consonantsInARow + 1;
      return letter;
    };
  }
}
