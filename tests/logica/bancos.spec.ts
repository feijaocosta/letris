import { test, expect } from '@playwright/test';
import { normalizeWord } from '../../lib/normalize.mjs';
import { WordLibrary, type WordBankData } from '../../components/WordLibrary';
import { findWords } from '../../components/WordDetector';
import { LANGUAGE_CONFIGS, type LanguageConfig } from '../../config/languages';
import ptBank from '../../data/words/pt.json';

// Sprint 3 do multilíngue: um banco de palavras por idioma

test.describe('normalizeWord', () => {
  test('tira acentos e Ç no português', () => {
    expect(normalizeWord('maçã', 'pt')).toBe('MACA');
    expect(normalizeWord('Avô', 'pt')).toBe('AVO');
  });

  test('preserva o Ñ no espanhol (AÑO não vira ANO)', () => {
    expect(normalizeWord('año', 'es')).toBe('AÑO');
    expect(normalizeWord('niño', 'es')).toBe('NIÑO');
    expect(normalizeWord('pingüino', 'es')).toBe('PINGUINO');
    // Ñ escrito como N + til (NFD) vira um caractere só
    expect(Array.from(normalizeWord('año', 'es'))).toHaveLength(3);
  });

  test('no francês tira acentos e troca Œ por OE', () => {
    expect(normalizeWord('élève', 'fr')).toBe('ELEVE');
    expect(normalizeWord('cœur', 'fr')).toBe('COEUR');
    expect(normalizeWord('garçon', 'fr')).toBe('GARCON');
  });
});

test('o banco em português continua com as mesmas palavras e níveis', () => {
  const library = new WordLibrary(ptBank, LANGUAGE_CONFIGS.pt);
  expect(Object.values(ptBank.words).flat()).toHaveLength(386);
  expect(library.getAvailableLettersForLevel(1).join('')).toBe('AEIOURSTNL');
  expect(library.getRequiredWordsForLevel(1)).toBe(5);
  expect(library.getPoolNameForLevel(1)).toBe('basic');
});

test.describe('Ñ como letra própria (preparação para o espanhol)', () => {
  const es = { code: 'es', label: 'Español', locale: 'es', alphabet: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', vowels: 'AEIOU' } as unknown as LanguageConfig;
  const bank: WordBankData = {
    levels: [{ name: 'basic', addLetters: 'AEIOUÑN', mix: { 3: 2 }, goal: 1 }],
    words: { 3: ['AÑO', 'ANO'] },
  };
  const library = new WordLibrary(bank, es);

  test('Ñ conta como uma letra do nível e da palavra', () => {
    expect(library.getAvailableLettersForLevel(1)).toContain('Ñ');
    expect(library.drawWordsForLevel(1, new Set()).sort()).toEqual(['ANO', 'AÑO']);
  });

  test('o sorteio de letras solta o Ñ inteiro', () => {
    const next = library.createLetterGenerator(1, () => ['AÑO']);
    const letters = new Set(Array.from({ length: 500 }, next));
    expect(letters.has('Ñ')).toBe(true);
    expect([...letters].every(l => Array.from(l).length === 1)).toBe(true);
  });

  test('AÑO no tabuleiro não vale como ANO, e vice-versa', () => {
    const row = (s: string) => Array.from(s).map(c => ({ letter: c === '.' ? null : c }));
    expect(findWords([row('AÑO.......')], new Set(['ANO'])).map(w => w.word)).toEqual([]);
    expect(findWords([row('AÑO.......')], new Set(['AÑO'])).map(w => w.word)).toEqual(['AÑO']);
    expect(findWords([row('ANO.......')], new Set(['AÑO'])).map(w => w.word)).toEqual([]);
  });
});
