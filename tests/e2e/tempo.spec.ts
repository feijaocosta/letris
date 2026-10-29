import { test, expect, startGame, state, setPiece } from './helpers';

// PR #16: a pausa acelerava o jogo e girar sem parar segurava a peça no ar.

test('pausar por muito tempo não acelera a queda', async ({ page }) => {
  await page.clock.install();
  await startGame(page);
  const before = (await state(page)).fallMs;

  await page.getByRole('button', { name: 'Pausar' }).click();
  await page.clock.runFor(10 * 60 * 1000);
  await page.getByRole('button', { name: 'Continuar' }).click();

  expect((await state(page)).fallMs).toBe(before);
});

test('girar sem parar não segura a peça no ar', async ({ page }) => {
  await page.clock.install();
  await startGame(page);
  await setPiece(page, 'AB', 4, 0);
  const fallMs = (await state(page)).fallMs;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('ArrowUp');
    await page.clock.runFor(fallMs / 4);
  }
  // 3 tempos de queda se passaram: a peça tem que ter descido ~3 linhas
  expect((await state(page)).piece?.y).toBeGreaterThanOrEqual(2);
});

test('o jogo pausa sozinho ao ir para o segundo plano', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await state(page)).paused).toBe(true);
});
