import { test, expect, state, setBoard, setPiece, setLevelWords, drop } from './helpers';
import en from '../../locales/en.json';
import enBank from '../../data/words/en.json';

// Sprint 4 do multilíngue: o jogo em inglês
const EN_WORDS = new Set(Object.values(enBank.words).flat());

test.beforeEach(async ({ page }) => {
  await page.goto('/?lang=en');
  await page.getByRole('button', { name: en.home.play, exact: true }).click();
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
});

test('?lang=en: partida com palavras e textos em inglês', async ({ page }) => {
  const s = await state(page);
  expect(s.levelWords.length).toBeGreaterThanOrEqual(5);
  for (const w of s.levelWords) expect(EN_WORDS.has(w), `${w} é do banco em inglês`).toBe(true);
  await expect(page.getByText(en.game.goal, { exact: true })).toBeVisible();
  await expect(page.getByText(en.game.letters, { exact: true })).toBeVisible();
});

test('palavra em inglês da lista some e pontua', async ({ page }) => {
  await setLevelWords(page, ['SUN', 'TEA', 'OUR', 'NET', 'LOT']);
  await setBoard(page, ['SU........']);
  await setPiece(page, 'N', 2);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['SUN']);
});

test('fim de jogo em inglês com o anúncio próprio clicável (a arte em português vale para todos os idiomas)', async ({ page }) => {
  await setLevelWords(page, ['SUN', 'TEA', 'OUR', 'NET', 'LOT']);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: en.gameOver.playAgain })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(en.ads.label)).toBeVisible();
  // Depois do tempo do AdSense, aparece a Vitrine (por enquanto igual em todos os idiomas)
  await expect(page.locator('a[href="https://vitrine.kingdomapps.net"]')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(en.ads.placeholder)).toHaveCount(0);
  expect(Number(await page.evaluate(() => localStorage.getItem('letris:bestLevel:en')))).toBe(1);
});
