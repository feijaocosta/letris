import { test, expect } from '@playwright/test';
import { findWords } from '../../components/WordDetector';
import { ScoreSystem } from '../../components/ScoreSystem';
import { WordLibrary } from '../../components/WordLibrary';
import { LANGUAGE_CONFIGS } from '../../config/languages';
import ptBank from '../../data/words/pt.json';
import { SPEED } from '../../config/gameplay';

// Regras do jogo testadas sem navegador. Cada teste cita o PR que corrigiu
// ou definiu o comportamento, para o problema não voltar.

const board = (...rows: string[]) => rows.map(r => r.split('').map(c => ({ letter: c === '.' ? null : c })));
const VOWELS = new Set('AEIOU');
const library = new WordLibrary(ptBank, LANGUAGE_CONFIGS.pt);

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

test.describe('sorteio das palavras (PR #17)', () => {
  test('não repete palavras entre níveis da mesma partida', () => {
    const used = new Set<string>();
    for (let level = 1; level <= 10; level++) {
      const words = library.drawWordsForLevel(level, used);
      for (const w of words) {
        expect(used.has(w), `${w} repetida no nível ${level}`).toBe(false);
        used.add(w);
      }
    }
  });

  test('cada nível sorteia palavras suficientes para a meta e só com letras liberadas', () => {
    for (let level = 1; level <= 12; level++) {
      const words = library.drawWordsForLevel(level, new Set());
      const letters = new Set(library.getAvailableLettersForLevel(level));
      expect(words.length).toBeGreaterThanOrEqual(library.getRequiredWordsForLevel(level));
      for (const w of words) {
        expect([...w].every(l => letters.has(l)), `${w} no nível ${level}`).toBe(true);
      }
    }
  });

  test('a partir do nível 2 já aparecem palavras maiores', () => {
    for (let level = 2; level <= 10; level++) {
      const words = library.drawWordsForLevel(level, new Set());
      expect(words.some(w => w.length >= 4), `nível ${level}: ${words.join(' ')}`).toBe(true);
    }
  });

  test('nunca saem mais de 3 consoantes seguidas', () => {
    for (const level of [1, 3, 6, 10]) {
      const words = library.drawWordsForLevel(level, new Set());
      const next = library.createLetterGenerator(level, () => words);
      let run = 0;
      for (let i = 0; i < 1000; i++) {
        run = VOWELS.has(next()) ? 0 : run + 1;
        expect(run, `nível ${level}`).toBeLessThanOrEqual(3);
      }
    }
  });
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
