import { test, expect, state } from './helpers';
import pt from '../../locales/pt.json';

// Antes das peças caírem, a lista de palavras do nível aparece por 5 s
const play = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: pt.home.play, exact: true }).click();

test('mostra as palavras do nível e as peças não caem enquanto isso', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await play(page);
  await expect(page.getByRole('heading', { name: 'Nível 1' })).toBeVisible();
  await expect(page.getByText('Forme 5 destas palavras')).toBeVisible();
  const s = await state(page);
  expect(s.phase).toBe('intro');
  for (const w of s.levelWords) await expect(page.getByText(w, { exact: true }).first()).toBeVisible();

  const y = (await state(page)).piece?.y;
  // 3 s simulados (o relógio do teste também anda em tempo real entre os passos)
  await page.clock.runFor(3_000);
  expect((await state(page)).piece?.y, 'a peça não desce durante a contagem').toBe(y);
  expect((await state(page)).phase).toBe('intro');
});

test('depois de 5 segundos o nível começa sozinho', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await play(page);
  await expect(page.getByRole('button', { name: pt.levelIntro.start })).toBeVisible();
  await page.clock.runFor(5_100);
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  await expect(page.getByRole('button', { name: pt.levelIntro.start })).toHaveCount(0);
});

test('"Começar agora" começa na hora', async ({ page }) => {
  await page.goto('/');
  await play(page);
  await page.getByRole('button', { name: pt.levelIntro.start }).click();
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  // e a peça passa a cair
  const y = (await state(page)).piece!.y;
  await expect.poll(async () => (await state(page)).piece?.y ?? 99, { timeout: 3_000 }).toBeGreaterThan(y);
});

test('a contagem não acelera o jogo (não conta como tempo jogado)', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await play(page);
  await page.clock.runFor(4_500);
  expect((await state(page)).fallMs).toBe(1000);
});
