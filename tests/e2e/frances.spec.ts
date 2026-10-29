import { test, expect, state, setBoard, setPiece, setLevelWords, drop } from './helpers';
import { LOCALES, BANKS } from '../locales';

// Sprint 6 do multilíngue: o jogo em francês (sem acentos; Œ vira OE)
const fr = LOCALES.fr;
const FR_WORDS = new Set(Object.values(BANKS.fr.words).flat());

test.beforeEach(async ({ page }) => {
  await page.goto('/?lang=fr');
  await page.getByRole('button', { name: fr.home.play, exact: true }).click();
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
});

test('?lang=fr: partida com palavras e textos em francês', async ({ page }) => {
  const s = await state(page);
  expect(s.levelWords.length).toBeGreaterThanOrEqual(5);
  for (const w of s.levelWords) expect(FR_WORDS.has(w), `${w} é do banco em francês`).toBe(true);
  await expect(page.getByText(fr.game.goal, { exact: true })).toBeVisible();
});

test('CŒUR entra no banco como COEUR (5 letras) e vale no tabuleiro', async ({ page }) => {
  expect(FR_WORDS.has('COEUR')).toBe(true);
  await setLevelWords(page, ['COEUR', 'MER', 'LIT', 'ROI', 'SEL']);
  await setBoard(page, ['COEU......']);
  await setPiece(page, 'R', 4);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['COEUR']);
});
