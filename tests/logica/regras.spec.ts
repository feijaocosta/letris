import { test, expect } from '@playwright/test';
import { findWords } from '../../components/WordDetector';
import { ScoreSystem } from '../../components/ScoreSystem';
import { WordLibrary } from '../../components/WordLibrary';
import { LANGUAGE_CONFIGS, LANGUAGE_LIST } from '../../config/languages';
import { BANKS } from '../locales';
import { SPEED } from '../../config/gameplay';

// Regras do jogo testadas sem navegador. Cada teste cita o PR que corrigiu
// ou definiu o comportamento, para o problema não voltar.

const board = (...rows: string[]) => rows.map(r => r.split('').map(c => ({ letter: c === '.' ? null : c })));

test.describe('palavras', () => {
  test('vale só a maior quando uma palavra está dentro de outra (PR #17)', () => {
    const found = findWords(board('SALTO.....'), new Set(['SAL', 'ALTO', 'SALTO']));
    expect(found.map(w => w.word)).toEqual(['SALTO']);
  });

  test('só valem as palavras da lista do nível, como num caça-palavras (PR #20)', () => {
    const found = findWords(board('SOL.......', '..........', 'RIO.......'), new Set(['RIO']));
    expect(found.map(w => w.word)).toEqual(['RIO']);
  });

  test('acha palavras na vertical', () => {
    const found = findWords(board('R.........', 'I.........', 'O.........'), new Set(['RIO']));
    expect(found.map(w => w.word)).toEqual(['RIO']);
  });
});

// Vale para todos os idiomas (PR #17; inglês no sprint 4 do multilíngue)

for (const config of LANGUAGE_LIST) {
  const lib = new WordLibrary(BANKS[config.code], config);
  const breakers = new Set(config.vowels + (config.extraVowels ?? ''));

  test.describe(`sorteio das palavras (PR #17) · ${config.code}`, () => {
    test('não repete palavras entre níveis da mesma partida', () => {
      const used = new Set<string>();
      for (let level = 1; level <= 10; level++) {
        const words = lib.drawWordsForLevel(level, used);
        for (const w of words) {
          expect(used.has(w), `${w} repetida no nível ${level}`).toBe(false);
          used.add(w);
        }
      }
    });

    test('cada nível sorteia palavras suficientes para a meta e só com letras liberadas', () => {
      for (let level = 1; level <= 12; level++) {
        const words = lib.drawWordsForLevel(level, new Set());
        const letters = new Set(lib.getAvailableLettersForLevel(level));
        expect(words.length).toBeGreaterThanOrEqual(lib.getRequiredWordsForLevel(level));
        for (const w of words) {
          expect(Array.from(w).every(l => letters.has(l)), `${w} no nível ${level}`).toBe(true);
        }
      }
    });

    test('a partir do nível 2 já aparecem palavras maiores', () => {
      for (let level = 2; level <= 10; level++) {
        const words = lib.drawWordsForLevel(level, new Set());
        expect(words.some(w => w.length >= 4), `nível ${level}: ${words.join(' ')}`).toBe(true);
      }
    });

    test('nunca saem mais de 3 consoantes seguidas, do nível 1 ao 10', () => {
      for (let level = 1; level <= 10; level++) {
        const words = lib.drawWordsForLevel(level, new Set());
        const next = lib.createLetterGenerator(level, () => words);
        let run = 0;
        for (let i = 0; i < 500; i++) {
          run = breakers.has(next()) ? 0 : run + 1;
          expect(run, `nível ${level}`).toBeLessThanOrEqual(3);
        }
      }
    });
  });
}

test('inglês: Y quebra a sequência de consoantes, mas a vogal forçada é A E I O U', () => {
  const en = LANGUAGE_CONFIGS.en;
  const lib = new WordLibrary({ levels: [{ name: 'basic', addLetters: 'AEIOUYSKFLGM', mix: { 3: 1 }, goal: 1 }], words: { 3: ['SKY'] } }, en);
  // Só sobram palavras sem vogal "de verdade": o sorteio usa Y e consoantes
  const next = lib.createLetterGenerator(1, () => ['SKY', 'FLY', 'GYM']);
  let run = 0;
  for (let i = 0; i < 2000; i++) {
    const letter = next();
    if (run === 3) expect('AEIOU', 'depois de 3 consoantes vem vogal').toContain(letter);
    run = 'AEIOUY'.includes(letter) ? 0 : run + 1;
  }
});

test.describe('pontuação', () => {
  test('palavra e linha juntas contam as duas, com bônus (PR #10)', () => {
    const onlyWord = ScoreSystem.scoreClear([{ word: 'RIO', repeated: false }], 0, 1, false);
    const onlyLine = ScoreSystem.scoreClear([], 1, 1, false);
    const both = ScoreSystem.scoreClear([{ word: 'RIO', repeated: false }], 1, 1, false);
    expect(both.points).toBeGreaterThan(onlyWord.points + onlyLine.points);
  });

  test('palavra repetida no nível vale menos que a nova', () => {
    const fresh = ScoreSystem.scoreClear([{ word: 'RIO', repeated: false }], 0, 1, false);
    const repeated = ScoreSystem.scoreClear([{ word: 'RIO', repeated: true }], 0, 1, false);
    expect(repeated.points).toBeLessThan(fresh.points);
  });

  test('palavras maiores valem mais', () => {
    expect(ScoreSystem.wordValue('SALTO')).toBeGreaterThan(ScoreSystem.wordValue('SAL'));
  });
});

test.describe('velocidade (PR #16 e #17)', () => {
  test('começa em 1 s por linha e acelera aos poucos a cada nível', () => {
    expect(ScoreSystem.calculateFallSpeed(1, 0)).toBe(SPEED.initialMs);
    for (let level = 2; level <= 15; level++) {
      const before = ScoreSystem.calculateFallSpeed(level - 1, 0);
      const now = ScoreSystem.calculateFallSpeed(level, 0);
      expect(now).toBeLessThanOrEqual(before);
      expect(before - now).toBeLessThanOrEqual(SPEED.perLevelMs);
    }
  });

  test('o tempo jogado no nível acelera no máximo o limite configurado', () => {
    const start = ScoreSystem.calculateFallSpeed(3, 0);
    const late = ScoreSystem.calculateFallSpeed(3, 60 * 60 * 1000);
    expect(start - late).toBe(SPEED.maxTimeReductionMs);
  });

  test('nunca fica mais rápido que o mínimo', () => {
    expect(ScoreSystem.calculateFallSpeed(99, 60 * 60 * 1000)).toBe(SPEED.minMs);
  });
});

test('todo idioma do jogo está nos testes (tests/locales.ts)', () => {
  for (const { code } of LANGUAGE_LIST) expect(Object.keys(BANKS), code).toContain(code);
});
