import { test, expect, startGame, state, chooseGame } from './helpers';
import pt from '../../locales/pt.json';

// O jogo é em pé: com o celular deitado aparece o aviso e a partida pausa
test('celular deitado: aviso "Gire o celular" e jogo pausado', async ({ page }) => {
  await startGame(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('heading', { name: pt.rotate.title })).toBeVisible();
  await expect.poll(async () => (await state(page)).paused).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: pt.rotate.title })).toHaveCount(0);
  // Volta pausado: o jogador escolhe quando continuar
  await page.getByRole('button', { name: pt.pause.resume }).click();
  await expect.poll(async () => (await state(page)).paused).toBe(false);
});

test('na entrada, deitado também mostra o aviso', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('heading', { name: pt.rotate.title })).toBeVisible();
});

test.describe('computador', () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 720 } });
  test('tela larga de computador não mostra o aviso', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('mode-classic')).toBeVisible();
    await expect(page.getByRole('heading', { name: pt.rotate.title })).toHaveCount(0);
  });
});
