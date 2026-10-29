import { test, expect, startGame, state, setPiece, setBoard } from './helpers';

test.describe('botões de controle (PR #10 e #11)', () => {
  test('um toque no botão anda uma casa só (não anda de novo ao soltar o dedo)', async ({ page }) => {
    await startGame(page);
    await setPiece(page, 'A', 5);
    await page.getByRole('button', { name: 'Mover para a esquerda' }).tap();
    await page.waitForTimeout(300);
    expect((await state(page)).piece?.x).toBe(4);

    await page.getByRole('button', { name: 'Mover para a direita' }).tap();
    await page.getByRole('button', { name: 'Mover para a direita' }).tap();
    await page.waitForTimeout(300);
    expect((await state(page)).piece?.x).toBe(6);
  });

  test('girar com o botão gira uma vez só', async ({ page }) => {
    await startGame(page);
    await setPiece(page, 'ABC', 3, 2);
    await page.getByRole('button', { name: 'Girar' }).tap();
    await page.waitForTimeout(300);
    // 1×3 deitada vira 3×1 em pé (girar duas vezes voltaria a ficar deitada)
    expect((await state(page)).piece?.letters.length).toBe(3);
  });

  test('soltar leva a peça até o fundo', async ({ page }) => {
    await startGame(page);
    await setBoard(page, []);
    await setPiece(page, 'A', 0);
    await page.getByRole('button', { name: 'Soltar peça' }).tap();
    await expect.poll(async () => (await state(page)).board[19][0]).toBe('A');
  });
});

test.describe('gestos no tabuleiro (PR #12)', () => {
  test.use({ controlMode: 'gestures' });

  test('no modo Gestos os botões somem', async ({ page }) => {
    await startGame(page);
    await expect(page.getByRole('button', { name: 'Girar' })).toHaveCount(0);
  });

  test('tocar no tabuleiro gira a peça', async ({ page }) => {
    await startGame(page);
    await setPiece(page, 'ABC', 3, 2);
    await page.locator('.bg-deep').tap();
    await page.waitForTimeout(300);
    expect((await state(page)).piece?.letters.length).toBe(3);
  });
});
