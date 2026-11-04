import { test, expect, state } from './helpers';
import type { Page } from '@playwright/test';
import pt from '../../locales/pt.json';
import { LOCALES } from '../locales';
import { TUTORIAL_WORDS } from '../../config/tutorial';

// Tutorial da primeira partida: roteiro com peças e palavras fixas
test.use({ tutorialSeen: false });

const step = (page: Page) => page.locator('[data-tutorial-step]').getAttribute('data-tutorial-step');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tap = async (page: Page, name: string, times = 1) => {
  for (let i = 0; i < times; i++) await button(page, name).tap();
};
const play = (page: Page) => page.getByRole('button', { name: pt.home.play, exact: true }).click();

test('roteiro completo no modo Botões e "Agora é com você!" começa o nível 1 do zero', async ({ page }) => {
  await page.goto('/');
  await play(page);

  // 1. mover
  await expect.poll(() => step(page)).toBe('move');
  await expect(page.getByText(pt.tutorial.moveButtons)).toBeVisible();
  await expect(button(page, pt.game.moveLeft)).toHaveClass(/tutorial-highlight/);
  await tap(page, pt.game.moveLeft, 2);
  // 2. girar
  await expect.poll(() => step(page)).toBe('rotate');
  await expect(button(page, pt.game.rotate)).toHaveClass(/tutorial-highlight/);
  await tap(page, pt.game.rotate);
  // 3. descer e soltar
  await expect.poll(() => step(page)).toBe('drop');
  await tap(page, pt.game.drop);
  // 4. palavra: SO no canto e a peça com o L em x=4
  await expect.poll(() => step(page)).toBe('word');
  expect((await state(page)).board[19]).toBe('SO........');
  await expect(page.getByText('Leve o L até o lado de SO e encaixe para formar SOL.')).toBeVisible();
  await tap(page, pt.game.moveLeft, 2);
  await tap(page, pt.game.drop);
  await expect.poll(async () => (await state(page)).found).toEqual(['SOL']);
  // 5. linha
  await expect.poll(() => step(page), { timeout: 4_000 }).toBe('line');
  await tap(page, pt.game.moveRight, 5);
  await tap(page, pt.game.drop);
  await expect.poll(async () => (await state(page)).lines).toBe(1);
  // 6. meta
  await expect.poll(() => step(page), { timeout: 4_000 }).toBe('goal');
  await tap(page, pt.game.moveRight, 4);
  await tap(page, pt.game.drop);
  await expect(page.getByRole('heading', { name: pt.tutorial.doneTitle })).toBeVisible({ timeout: 4_000 });

  await button(page, pt.tutorial.doneStart).click();
  const s = await state(page);
  expect(s.phase).toBe('intro');
  expect(s.level).toBe(1);
  expect(s.score).toBe(0);
  expect(s.lines).toBe(0);
  expect(s.found).toEqual([]);
  expect(s.board.every(row => row === '..........')).toBe(true);
  expect(s.levelWords).not.toEqual(TUTORIAL_WORDS.pt);
  expect(await page.evaluate(() => localStorage.getItem('letris:tutorialDone'))).toBe('true');
});

test('peça no lugar errado: "Quase! Tente de novo." e o passo recomeça', async ({ page }) => {
  await page.goto('/');
  await play(page);
  await tap(page, pt.game.moveLeft, 2);
  await expect.poll(() => step(page)).toBe('rotate');
  await tap(page, pt.game.rotate);
  await expect.poll(() => step(page)).toBe('drop');
  await tap(page, pt.game.drop);
  await expect.poll(() => step(page)).toBe('word');
  await tap(page, pt.game.drop); // solta em x=4, longe do SO
  await expect(page.getByText(pt.tutorial.retry)).toBeVisible();
  expect(await step(page)).toBe('word');
  expect((await state(page)).board[19]).toBe('SO........');
});

test('"Pular" vai direto para o nível 1 e o tutorial não volta', async ({ page }) => {
  await page.goto('/');
  await play(page);
  await expect.poll(() => step(page)).toBe('move');
  await button(page, pt.tutorial.skip).click();
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('button', { name: pt.home.newGame }).click(); // partida guardada do nível 1
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);
});

test('quem já tem recorde não vê o tutorial sozinho', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('letris:bestScore:pt', '500'));
  await page.goto('/');
  await play(page);
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);
});

test.describe('já viu o tutorial', () => {
  test.use({ tutorialSeen: true });
  test('"Ver tutorial" no Como jogar abre o tutorial de novo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: pt.common.howToPlay }).click();
    await page.getByRole('button', { name: pt.help.tutorial }).click();
    await expect.poll(() => step(page)).toBe('move');
  });
});

test.describe('modo Gestos', () => {
  test.use({ controlMode: 'gestures' });
  test('textos de gesto; deslizar move e tocar gira', async ({ page }) => {
    await page.goto('/');
    await play(page);
    await expect(page.getByText(pt.tutorial.moveGestures)).toBeVisible();
    const board = (await page.locator('.bg-deep').boundingBox())!;
    const cell = board.width / 10;
    const y = board.y + board.height * 0.8;
    // desliza 2 colunas para a direita
    await page.mouse.move(board.x + board.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(board.x + board.width / 2 + cell * 2.4, y, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => step(page)).toBe('rotate');
    await expect(page.getByText(pt.tutorial.rotateGestures)).toBeVisible();
    await page.locator('.bg-deep').tap();
    await expect.poll(() => step(page)).toBe('drop');
    await expect(page.getByText(pt.tutorial.dropGestures)).toBeVisible();
  });
});

for (const [lang, locale] of Object.entries(LOCALES)) {
  test(`em ${lang}: textos do idioma e as palavras do tutorial na lista`, async ({ page }) => {
    await page.goto(`/?lang=${lang}`);
    await page.getByRole('button', { name: locale.home.play, exact: true }).click();
    await expect(page.getByText(locale.tutorial.moveButtons)).toBeVisible();
    await expect(page.getByText(locale.tutorial.skip, { exact: true })).toBeVisible();
    expect((await state(page)).levelWords).toEqual(TUTORIAL_WORDS[lang as keyof typeof TUTORIAL_WORDS]);
  });
}

test.describe('métricas', () => {
  test.use({ consent: 'granted' });
  test('tutorial_start, tutorial_step e tutorial_skip', async ({ page }) => {
    await page.goto('/');
    await play(page);
    await tap(page, pt.game.moveLeft, 2);
    await expect.poll(() => step(page)).toBe('rotate');
    await button(page, pt.tutorial.skip).click();
    const events = await page.evaluate(() => (window.dataLayer ?? []).map(a => Array.from(a as ArrayLike<unknown>))
      .filter(a => a[0] === 'event').map(a => ({ name: a[1] as string, ...(a[2] as Record<string, unknown>) })));
    const names = events.map(e => e.name);
    expect(names).toContain('tutorial_start');
    expect(events.filter(e => e.name === 'tutorial_step').map(e => e.step)).toEqual(['move', 'rotate']);
    expect(events.find(e => e.name === 'tutorial_skip')).toMatchObject({ step: 'rotate' });
    expect(names).not.toContain('word_formed');
  });
});
