import { test, expect, state } from './helpers';
import pt from '../../locales/pt.json';

// Sprint 3 do multilíngue: o banco de palavras é carregado à parte (um
// arquivo por idioma) e precisa estar no cache do PWA para jogar offline.
test('depois da primeira visita, o jogo abre e começa sem internet', async ({ page, context }) => {
  await page.goto('/');
  // Service Worker ativo = precache baixado; recarrega para ele controlar a página
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: pt.home.play, exact: true }).click();
  await expect(page.getByRole('button', { name: pt.game.pause }), 'a partida começou offline').toBeVisible();
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
  expect((await state(page)).levelWords.length).toBeGreaterThanOrEqual(5);
  await context.setOffline(false);
});
