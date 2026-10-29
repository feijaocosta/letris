import { test, expect, startGame, state, setBoard, setPiece, setLevelWords, drop, LIST } from './helpers';
import pt from '../../locales/pt.json';
import en from '../../locales/en.json';

// Sprint 2 do multilíngue: escolha do idioma, recordes por idioma e métricas
const stored = (page: import('@playwright/test').Page, key: string) =>
  page.evaluate(k => localStorage.getItem(`letris:${k}`), key);

test('?lang=pt abre em português, salva a escolha e sai da URL', async ({ page }) => {
  await page.goto('/?lang=pt');
  await expect(page.getByText(pt.home.tagline)).toBeVisible();
  expect(await stored(page, 'lang')).toBe('"pt"');
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('pt-BR');
  await expect(page).toHaveTitle(pt.meta.title);
});

test('?lang= de idioma que não existe é ignorado', async ({ page }) => {
  await page.goto('/?lang=xx');
  await expect(page.getByText(pt.home.tagline)).toBeVisible();
  expect(await stored(page, 'lang')).toBeNull();
});

test.describe('celular em espanhol (idioma ainda não disponível)', () => {
  test.use({ locale: 'es-ES' });
  test('abre em inglês', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(en.home.tagline)).toBeVisible();
  });
});

test.describe('celular em inglês', () => {
  test.use({ locale: 'en-US' });
  test('abre em inglês', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(en.home.tagline)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    await expect(page).toHaveTitle(en.meta.title);
  });
});

test('seletor de idioma na entrada troca os textos e guarda a escolha', async ({ page }) => {
  await page.goto('/');
  const picker = page.getByRole('radiogroup', { name: pt.home.language });
  await expect(picker).toBeVisible();
  await picker.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByText(en.home.tagline)).toBeVisible();
  expect(await stored(page, 'lang')).toBe('"en"');
  await page.reload();
  await expect(page.getByText(en.home.tagline)).toBeVisible();
  await page.getByRole('radio', { name: 'Português' }).click();
  await expect(page.getByText(pt.home.tagline)).toBeVisible();
});

test('recordes separados por idioma', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('letris:test-recordes')) return;
    sessionStorage.setItem('letris:test-recordes', '1');
    localStorage.setItem('letris:bestScore:pt', '1234');
    localStorage.setItem('letris:bestScore:en', '567');
  });
  await page.goto('/');
  await expect(page.getByText('1.234')).toBeVisible();
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByText('567', { exact: true })).toBeVisible();
  await expect(page.getByText('1,234')).toHaveCount(0);
});

test('recorde antigo (de antes dos idiomas) continua aparecendo, agora como do português', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('letris:test-recorde')) return;
    sessionStorage.setItem('letris:test-recorde', '1');
    localStorage.setItem('letris:bestScore', '1234');
    localStorage.setItem('letris:bestLevel', '3');
  });
  await page.goto('/');
  await expect(page.getByText('1.234')).toBeVisible();
  expect(await stored(page, 'bestScore:pt')).toBe('1234');
  expect(await stored(page, 'bestLevel:pt')).toBe('3');
  expect(await stored(page, 'bestScore')).toBeNull();
  expect(await stored(page, 'bestLevel')).toBeNull();
});

test('o recorde é salvo no idioma do jogo', async ({ page }) => {
  await startGame(page);
  await setLevelWords(page, LIST);
  // Forma RIO para ter pontos, espera a limpeza e então enche o tabuleiro
  await setBoard(page, ['RI........']);
  await setPiece(page, 'O', 2);
  await drop(page);
  await expect.poll(async () => (await state(page)).found).toEqual(['RIO']);
  await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toBeVisible({ timeout: 5_000 });
  expect(Number(await stored(page, 'bestScore:pt'))).toBeGreaterThan(0);
  expect(await stored(page, 'bestLevel:pt')).toBe('1');
  expect(await stored(page, 'bestScore')).toBeNull();
  expect(await stored(page, 'bestLevel')).toBeNull();
});

test.describe('métricas', () => {
  test.use({ consent: 'granted' });
  test('trocar o idioma registra language_change e os eventos seguintes saem no idioma novo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'English' }).click();
    await page.getByRole('button', { name: en.home.play, exact: true }).click();
    await expect(page.getByRole('button', { name: en.game.pause })).toBeVisible();
    const events = await page.evaluate(() => (window.dataLayer ?? []).map(a => Array.from(a as ArrayLike<unknown>))
      .filter(a => a[0] === 'event').map(a => ({ name: a[1] as string, ...(a[2] as Record<string, unknown>) })));
    expect(events.find(e => e.name === 'language_change')).toMatchObject({ from: 'pt', to: 'en' });
    expect(events.find(e => e.name === 'game_start')).toMatchObject({ game_language: 'en' });
  });

  test('todo evento leva o idioma e a versão do jogo', async ({ page }) => {
    await startGame(page);
    const events = await page.evaluate(() => (window.dataLayer ?? []).map(a => Array.from(a as ArrayLike<unknown>))
      .filter(a => a[0] === 'event').map(a => a[2] as Record<string, unknown>));
    expect(events.length).toBeGreaterThan(0);
    for (const params of events) {
      expect(params.game_language).toBe('pt');
      expect(String(params.game_version)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});
