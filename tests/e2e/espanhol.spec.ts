import { test, expect, state, setBoard, setPiece, setLevelWords, drop } from './helpers';
import { LOCALES, BANKS } from '../locales';

// Sprint 5 do multilíngue: o jogo em espanhol, com Ñ como letra própria
const es = LOCALES.es;
const ES_WORDS = new Set(Object.values(BANKS.es.words).flat());

test.beforeEach(async ({ page }) => {
  await page.goto('/?lang=es');
  await page.getByRole('button', { name: es.home.play, exact: true }).click();
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
});

test('?lang=es: partida com palavras e textos em espanhol', async ({ page }) => {
  const s = await state(page);
  expect(s.levelWords.length).toBeGreaterThanOrEqual(5);
  for (const w of s.levelWords) expect(ES_WORDS.has(w), `${w} é do banco em espanhol`).toBe(true);
  await expect(page.getByText(es.game.letters, { exact: true })).toBeVisible();
});

test('AÑO com Ñ no tabuleiro conta; ANO (sem Ñ) não conta como AÑO', async ({ page }) => {
  await setLevelWords(page, ['AÑO', 'SOL', 'MAR', 'RIO', 'OSO']);
  await setBoard(page, ['AN........']);
  await setPiece(page, 'O', 2);
  await drop(page);
  await page.waitForTimeout(1500);
  expect((await state(page)).found).toEqual([]);

  await setBoard(page, ['AÑ........']);
  await setPiece(page, 'O', 2);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['AÑO']);
});
