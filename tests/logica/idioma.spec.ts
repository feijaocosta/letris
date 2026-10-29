import { test, expect } from '@playwright/test';
import { detectLanguage } from '../../lib/i18n';

// Sprint 2 do multilíngue: idioma ao abrir o jogo
const ALL = ['pt', 'en', 'es', 'fr'];

test('?lang= na URL vence tudo', () => {
  expect(detectLanguage({ param: 'es', saved: 'pt', browser: ['fr-FR'] }, ALL)).toBe('es');
  expect(detectLanguage({ param: 'EN-us' }, ALL)).toBe('en');
});

test('sem ?lang=, vale a escolha salva no aparelho', () => {
  expect(detectLanguage({ saved: 'fr', browser: ['pt-BR'] }, ALL)).toBe('fr');
});

test('sem escolha, segue o idioma do navegador (o primeiro disponível)', () => {
  expect(detectLanguage({ browser: ['pt-BR', 'en'] }, ALL)).toBe('pt');
  expect(detectLanguage({ browser: ['de-DE', 'es-MX'] }, ALL)).toBe('es');
  expect(detectLanguage({ browser: ['fr-CA'] }, ALL)).toBe('fr');
});

test('idioma desconhecido cai no inglês; sem inglês pronto, no português', () => {
  expect(detectLanguage({ browser: ['de-DE', 'ja'] }, ALL)).toBe('en');
  expect(detectLanguage({ browser: ['de-DE'] }, ['pt'])).toBe('pt');
});

test('idioma que ainda não está pronto é ignorado', () => {
  expect(detectLanguage({ param: 'en', saved: 'es', browser: ['fr'] }, ['pt'])).toBe('pt');
  expect(detectLanguage({ param: 'xx', saved: 'en' }, ['pt', 'en'])).toBe('en');
});

test('todo idioma tem política de privacidade em public/', async () => {
  const { existsSync } = await import('node:fs');
  const { LANGUAGE_LIST } = await import('../../config/languages');
  for (const lang of LANGUAGE_LIST) {
    expect(existsSync(`public/${lang.privacyPage}`), `${lang.code}: public/${lang.privacyPage}`).toBe(true);
  }
});
