import { test, expect } from '@playwright/test';
import { translate, formatNumber } from '../../lib/i18n';
import { ScoreSystem } from '../../components/ScoreSystem';

// Textos da interface (PR #23): lib/i18n + locales/*.json

test('troca as variáveis do texto', () => {
  expect(translate('pt', 'levelComplete.title', { level: 3 })).toBe('Nível 3 concluído!');
  expect(translate('pt', 'levelComplete.nextLevel', { level: 4, pool: 'Avançado' })).toBe('Nível 4 · Avançado');
});

test('números no formato do idioma', () => {
  expect(formatNumber('pt', 8634)).toBe('8.634');
  expect(translate('pt', 'score.combo', { factor: 1.5 })).toBe('Combo ×1,5');
});

test('chave que não existe aparece como a própria chave (fácil de achar na tela)', () => {
  expect(translate('pt', 'home.naoExiste' as never)).toBe('home.naoExiste');
});

test('os rótulos da pontuação são chaves de texto válidas', () => {
  const { labels } = ScoreSystem.scoreClear(
    [{ word: 'RIO', repeated: true }, { word: 'SAL', repeated: false }], 4, 1, true);
  const texts = labels.map(l => translate('pt', l.key, l.vars));
  expect(texts).toEqual(['Combo ×1,5', 'Repetida', 'TETRIS!', 'Palavra + linha', 'Cascata']);
});
