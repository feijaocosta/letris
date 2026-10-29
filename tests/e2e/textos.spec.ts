import { test, expect, startGame, state, setBoard, setPiece, setLevelWords, drop, LIST } from './helpers';
import type { Page } from '@playwright/test';
import pt from '../../locales/pt.json';
import { LOCALES } from '../locales';

// PR #23: os textos saíram do código para locales/pt.json. Nenhuma tela pode
// mostrar uma chave crua ("home.play") no lugar do texto.
const GROUPS = Object.keys(pt).join('|');
const RAW_KEY = new RegExp(`\\b(${GROUPS})\\.[a-z][A-Za-z0-9]*\\b`);

async function expectNoRawKeys(page: Page, screen: string) {
  const text = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('[aria-label], [alt]')]
      .map(el => `${el.getAttribute('aria-label') ?? ''} ${el.getAttribute('alt') ?? ''}`);
    return `${document.body.innerText}\n${labels.join('\n')}`;
  });
  expect(text, `chave sem tradução na tela: ${screen}`).not.toMatch(RAW_KEY);
}

test('nenhuma tela mostra chave de texto sem tradução', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(pt.home.tagline)).toBeVisible();
  await expectNoRawKeys(page, 'entrada');

  await page.getByRole('button', { name: pt.common.howToPlay }).click();
  await expect(page.getByText(pt.help.wordsTitle, { exact: true })).toBeVisible();
  await expectNoRawKeys(page, 'como jogar');
  await page.getByRole('button', { name: pt.help.close }).click();

  await startGame(page);
  await expectNoRawKeys(page, 'jogo');

  await page.getByRole('button', { name: pt.game.pause }).click();
  await expect(page.getByText(pt.pause.title, { exact: true })).toBeVisible();
  await expectNoRawKeys(page, 'pausa');
  await page.getByRole('button', { name: pt.pause.resume }).click();

  // Palavra + linha: aviso de pontos com rótulos
  await setLevelWords(page, LIST);
  await setBoard(page, ['LUAZZZZZZ.']);
  await setPiece(page, 'Z', 9);
  await drop(page);
  await expect(page.getByText(pt.score.wordAndLine)).toBeVisible();
  await expectNoRawKeys(page, 'aviso de pontos');
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true); // limpeza terminou

  // Fim de nível
  await setBoard(page, ['LU........', 'RIO.......', 'SAL.......', 'TIA.......', 'REI.......']);
  await setPiece(page, 'A', 2);
  await drop(page);
  await expect(page.getByText(pt.levelSplash.title)).toBeVisible({ timeout: 4_000 });
  await expectNoRawKeys(page, 'comemoração');
  await expect(page.getByRole('button', { name: pt.levelComplete.continue })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText('Nível 2 · Básico')).toBeVisible();
  await expectNoRawKeys(page, 'nível concluído');
  await page.getByRole('button', { name: pt.levelComplete.continue }).click();

  // Fim de jogo
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toBeVisible({ timeout: 5_000 });
  await expectNoRawKeys(page, 'fim de jogo');
});

for (const [lang, locale] of Object.entries(LOCALES).filter(([l]) => l !== 'pt')) {
  test(`em ${lang}, entrada, ajuda e pausa sem chave crua (sprints 4 a 6)`, async ({ page }) => {
    await page.goto(`/?lang=${lang}`);
    await expect(page.getByText(locale.home.tagline)).toBeVisible();
    await expectNoRawKeys(page, `entrada ${lang}`);
    await page.getByRole('button', { name: locale.common.howToPlay }).click();
    await expect(page.getByText(locale.help.wordsTitle, { exact: true })).toBeVisible();
    await expectNoRawKeys(page, `como jogar ${lang}`);
    await page.getByRole('button', { name: locale.help.close }).click();
    await page.getByRole('button', { name: locale.home.play, exact: true }).click();
    await page.getByRole('button', { name: locale.game.pause }).click();
    await expect(page.getByText(locale.pause.title, { exact: true })).toBeVisible();
    await expectNoRawKeys(page, `pausa ${lang}`);
  });
}

test.describe('aviso de cookies', () => {
  test.use({ consent: null });
  test('sem chave crua', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: pt.consent.accept })).toBeVisible();
    await expectNoRawKeys(page, 'cookies');
  });
});
