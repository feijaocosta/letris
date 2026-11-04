import { test, expect, startGame, skipIntro, state, setBoard, setPiece, setLevelWords, drop, LIST } from './helpers';
import type { Page } from '@playwright/test';
import pt from '../../locales/pt.json';

// A partida fica guardada no aparelho: se o celular fechar a página em
// segundo plano, ao abrir de novo dá para continuar de onde parou.

const continueButton = (page: Page) => page.getByRole('button', { name: new RegExp(pt.home.continue) });

async function formRio(page: Page) {
  await setLevelWords(page, LIST);
  await setBoard(page, ['ZZ........', 'RI........']);
  await setPiece(page, 'O', 2);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['RIO']);
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true); // limpeza terminou
}

test('pausar, fechar e abrir de novo: "Continuar" volta a partida igual, pausada', async ({ page }) => {
  await startGame(page);
  await formRio(page);
  await page.getByRole('button', { name: pt.game.pause }).click();
  const before = await state(page);

  await page.reload(); // como o iPhone fechando a página
  await expect(continueButton(page)).toBeVisible();
  await expect(continueButton(page)).toContainText(`Nível 1 · ${before.score.toLocaleString('pt-BR')} pts`);
  await expect(page.getByRole('button', { name: pt.home.play, exact: true })).toHaveCount(0);
  await continueButton(page).click();

  await expect(page.getByRole('button', { name: pt.pause.resume })).toBeVisible();
  const after = await state(page);
  expect(after.paused).toBe(true);
  expect(after.score).toBe(before.score);
  expect(after.level).toBe(1);
  expect(after.found).toEqual(['RIO']);
  expect(after.levelWords).toEqual(before.levelWords);
  expect(after.board).toEqual(before.board);
  expect(after.board[18]).toBe('ZZ........');

  // e segue jogando normalmente
  await page.getByRole('button', { name: pt.pause.resume }).click();
  await expect.poll(async () => (await state(page)).paused).toBe(false);
  await setBoard(page, ['SA........']);
  await setPiece(page, 'L', 2);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['RIO', 'SAL']);
});

test('indo para o segundo plano sem pausar também guarda', async ({ page }) => {
  await startGame(page);
  await formRio(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.reload();
  await continueButton(page).click();
  expect((await state(page)).found).toEqual(['RIO']);
});

test('"Novo jogo" na entrada descarta a guardada e começa do zero', async ({ page }) => {
  await startGame(page);
  await formRio(page);
  await page.getByRole('button', { name: pt.game.pause }).click();
  await page.reload();
  await page.getByRole('button', { name: pt.home.newGame }).click();
  await skipIntro(page);
  const s = await state(page);
  expect(s.score).toBe(0);
  expect(s.found).toEqual([]);
});

test('fim de jogo apaga a partida guardada', async ({ page }) => {
  await startGame(page);
  await formRio(page);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toBeVisible({ timeout: 5_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: pt.home.play, exact: true })).toBeVisible();
  await expect(continueButton(page)).toHaveCount(0);
});

test('a partida guardada é do idioma em que foi jogada', async ({ page }) => {
  await startGame(page);
  await formRio(page);
  await page.getByRole('button', { name: pt.game.pause }).click();
  await page.goto('/?lang=en');
  await expect(page.getByRole('button', { name: 'PLAY', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Português' }).click();
  await expect(continueButton(page)).toBeVisible();
});

test('saiu no resumo do nível: volta no resumo e segue para o nível 2', async ({ page }) => {
  await startGame(page);
  await setLevelWords(page, LIST);
  await setBoard(page, ['LU........', 'RIO.......', 'SAL.......', 'TIA.......', 'REI.......']);
  await setPiece(page, 'A', 2);
  await drop(page);
  await expect(page.getByRole('button', { name: pt.levelComplete.continue })).toBeVisible({ timeout: 8_000 });
  const score = (await state(page)).score;

  await page.reload();
  await continueButton(page).click();
  await expect(page.getByRole('button', { name: pt.levelComplete.continue })).toBeVisible();
  expect((await state(page)).score).toBe(score);
  await page.getByRole('button', { name: pt.levelComplete.continue }).click();
  await expect.poll(async () => (await state(page)).level).toBe(2);
  expect((await state(page)).phase).toBe('intro');
});
