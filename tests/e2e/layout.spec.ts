import { test, expect, startGame, setLevelWords, type GameState } from './helpers';
import type { Page } from '@playwright/test';

// PR #7 (layout cortado no iPhone) e PR #21 (tabuleiro por cima das palavras).
const SIZES = [
  { width: 390, height: 844 },
  { width: 390, height: 660 },
  { width: 375, height: 560 },
];

async function measure(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element | null) => el?.getBoundingClientRect();
    const board = rect(document.querySelector('.bg-deep'))!;
    const words = rect(document.querySelector('.game-area .flex-wrap'))!;
    const controls = rect(document.querySelector('.game-controls'));
    const pause = rect(document.querySelector('[aria-label="Pausar"]'))!;
    return {
      board, words, controls, pause,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
}

function checkLayout(m: Awaited<ReturnType<typeof measure>>) {
  expect(m.scrollWidth, 'sem rolagem para os lados').toBeLessThanOrEqual(m.viewport.width);
  expect(m.board.width, 'tabuleiro com tamanho').toBeGreaterThan(100);
  expect(Math.round(m.board.height / m.board.width), 'tabuleiro 10×20').toBe(2);
  expect(m.board.top).toBeGreaterThanOrEqual(m.pause.bottom);
  expect(m.board.bottom, 'tabuleiro não cobre a lista de palavras').toBeLessThanOrEqual(m.words.top + 1);
  const bottom = m.controls ? m.controls.bottom : m.words.bottom;
  expect(bottom, 'nada cortado embaixo').toBeLessThanOrEqual(m.viewport.height);
}

for (const mode of ['buttons', 'gestures'] as const) {
  test.describe(`modo ${mode === 'buttons' ? 'Botões' : 'Gestos'}`, () => {
    test.use({ controlMode: mode });
    for (const size of SIZES) {
      test(`${size.width}×${size.height}: tudo cabe e o tabuleiro não cobre as palavras`, async ({ page }) => {
        await page.setViewportSize(size);
        await startGame(page);
        checkLayout(await measure(page));

        // Lista grande (3-4 linhas de palavras), como no nível 4 do PR #21
        await setLevelWords(page, ['ALUNO', 'CAMA', 'MAR', 'NAU', 'RIO', 'RITO', 'SODA', 'URSO', 'TERRA', 'LIMAO', 'SALTO', 'MURO']);
        await page.waitForTimeout(200);
        checkLayout(await measure(page));
      });
    }
  });
}

// Sprint 2 do multilíngue: o seletor de idioma deixa a entrada mais alta
for (const size of SIZES) {
  test(`entrada em ${size.width}×${size.height}: tudo cabe, até a linha de versão e privacidade`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    const privacy = page.getByRole('button', { name: 'Privacidade' });
    await expect(privacy).toBeVisible();
    const box = (await privacy.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
  });
}

test('as cinco cores dos blocos existem no CSS (PR #12: Tailwind apagava as não usadas)', async ({ page }) => {
  await page.goto('/');
  const colors = await page.evaluate(() =>
    ['blue', 'yellow', 'red', 'orange', 'green'].map(c =>
      getComputedStyle(document.documentElement).getPropertyValue(`--color-tile-${c}`).trim()));
  for (const c of colors) expect(c).not.toBe('');
});

export type { GameState };
