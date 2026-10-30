import { test, expect, startGame, setBoard, setLevelWords, drop, LIST, simularKerux } from './helpers';

test('abre sem erros e sem violar a CSP (PR #4)', async ({ page }) => {
  // a fixture já falha o teste se aparecer erro de JavaScript ou de CSP
  await startGame(page);
  await drop(page);
  await page.waitForTimeout(500);
});

test('um único Service Worker registrado (PR #4)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const scripts = await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistrations()).map(r => (r.active ?? r.installing ?? r.waiting)?.scriptURL));
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/\/sw\.js$/);
});

test('mostra "Atualizar" quando há versão nova publicada (PR #10)', async ({ page }) => {
  await page.route('**/version.json*', route => route.fulfill({ json: { version: 'versao-nova-de-teste' } }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible();
});

// No localhost o script do Google não carrega: os eventos ficam em window.dataLayer
const events = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window.dataLayer ?? []).map(args => Array.from(args as ArrayLike<unknown>))
    .filter(a => a[0] === 'event').map(a => a[1] as string));

test.describe('consentimento de cookies (PR #19)', () => {
  test.use({ consent: null });

  test('sem aceitar, nenhuma métrica é registrada', async ({ page, externalRequests }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await startGame(page);
    expect(await events(page)).toEqual([]);
    expect(externalRequests.filter(u => u.includes('googletagmanager') || u.includes('google-analytics'))).toEqual([]);
  });

  test('ao aceitar, os eventos do jogo são registrados', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await startGame(page);
    expect(await events(page)).toContain('game_start');
  });
});

test('anúncio próprio (Kerux) clicável mesmo com o bloco do Google por cima (PR #14 e #15)', async ({ page }) => {
  await simularKerux(page);
  await startGame(page);
  await setLevelWords(page, LIST);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);

  // O AdSense põe um iframe visível dentro do <ins> mesmo sem anúncio
  await page.locator('ins.adsbygoogle').evaluate(ins => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'visibility: visible; width: 300px; height: 250px; position: absolute; inset: 0;';
    ins.appendChild(frame);
  });

  const link = page.locator('a[href="https://vitrine.kingdomapps.net"]');
  await expect(link).toBeVisible({ timeout: 8_000 });
  const onTop = await link.evaluate(a => {
    const r = a.getBoundingClientRect();
    return a.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  });
  expect(onTop, 'o toque no centro do anúncio cai no link').toBe(true);
});

test('manifest do app instalado vale para todos os idiomas (sprint 8)', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toBe('LETRIS');
  expect(manifest.short_name).toBe('Letris');
  expect(manifest.description).not.toMatch(/português/i);
  expect(manifest.start_url).toBe('/');
});
