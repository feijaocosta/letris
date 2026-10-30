import type { Page } from '@playwright/test';
import { test, expect, startGame, state, setPiece, setBoard, setLevelWords, drop, LIST, simularKerux, keruxPedidos, modoKerux } from './helpers';
import { KERUX } from '../../config/ads';

// Kerux Ads no Letris (PR #26). Dois modos (config/ads.ts):
// - principal (atual): o Kerux entrega direto, sem esperar o Google;
// - fallback: o Google tenta antes e o Kerux entra quando ele não tem anúncio.
// Nos testes o Google está bloqueado, então ele nunca tem anúncio.
// O intervalo entre telas cheias é cadastrado no Kerux (posição), não no jogo.

// Tempo do AdSense desistir (4 s) + do sdk.js do Kerux desistir (3 s)
const ADS_E_SDK_MS = 7_500;

async function gameOver(page: Page) {
  await startGame(page);
  await setLevelWords(page, LIST);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: 'Jogar de novo' })).toBeVisible({ timeout: 5_000 });
}

async function bateMeta(page: Page) {
  await startGame(page);
  await setLevelWords(page, LIST);
  await setBoard(page, ['LU........', 'RIO.......', 'SAL.......', 'TIA.......', 'REI.......']);
  await setPiece(page, 'A', 2);
  await drop(page);
}

test('o jogo começa com o Kerux como anúncio principal', () => {
  expect(KERUX?.modo).toBe('principal');
});

test.describe('Kerux principal (sem esperar o Google)', () => {
  test('banner: Kerux na hora, sem o bloco do AdSense, com a configuração do jogo', async ({ page }) => {
    await simularKerux(page);
    await gameOver(page);
    // Sem os 4 s de espera do AdSense
    await expect(page.getByTestId('kerux-banner').getByRole('img', { name: `Kerux ${KERUX!.posicoes.banner}` })).toBeVisible({ timeout: 2_500 });
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    await expect(page.getByText('Espaço do anúncio')).toHaveCount(0);

    const kerux = await keruxPedidos(page);
    expect(kerux?.pedidos).toEqual(['fim-de-fase']);
    // O intervalo de cada posição vem do Kerux; o jogo não passa intervalo próprio
    expect(kerux?.config).toEqual({ site: 'letris', chave: KERUX!.chave, idioma: 'pt' });
  });

  test('banner: Kerux sem campanha → espaço reservado', async ({ page }) => {
    await simularKerux(page, { anuncio: false });
    await gameOver(page);
    await expect(page.getByText('Espaço do anúncio')).toBeVisible({ timeout: 2_500 });
  });

  test('banner: Kerux fora do ar (script bloqueado) → espaço reservado, sem erro', async ({ page }) => {
    // Sem simularKerux: o helper bloqueia tudo fora do localhost
    await gameOver(page);
    await expect(page.getByText('Espaço do anúncio')).toBeVisible({ timeout: 4_000 });
    await expect(page.getByTestId('kerux-banner').locator('[data-kerux]')).toHaveCount(0);
  });

  test('fim de nível: tela cheia do Kerux sem esperar o Google, e o resumo só depois de fechar', async ({ page }) => {
    await simularKerux(page);
    await bateMeta(page);
    const telaCheia = page.locator('[data-kerux-tela-cheia]');
    // Brilho (~0,9 s) + comemoração (~1,6 s), sem os 3 s do Google
    await expect(telaCheia.getByRole('img', { name: `Kerux ${KERUX!.posicoes.telaCheia}` })).toBeVisible({ timeout: 4_000 });
    await expect(page.getByRole('button', { name: 'Próximo nível' })).toHaveCount(0);

    await telaCheia.getByRole('button', { name: 'Fechar' }).click();
    await expect(telaCheia).toHaveCount(0);
    await page.getByRole('button', { name: 'Próximo nível' }).click();
    await expect.poll(async () => (await state(page)).level).toBe(2);
  });

  test('fim de nível: Kerux sem campanha (ou dentro do intervalo da posição) → resumo direto', async ({ page }) => {
    await simularKerux(page, { anuncio: false });
    await bateMeta(page);
    await expect(page.getByRole('button', { name: 'Próximo nível' })).toBeVisible({ timeout: 4_000 });
    expect((await keruxPedidos(page))?.pedidos).toContain('entre-fases');
    await expect(page.locator('[data-kerux-tela-cheia]')).toHaveCount(0);
  });

  test('jogar de novo: tela cheia do Kerux e, ao fechar, partida nova', async ({ page }) => {
    await simularKerux(page);
    await gameOver(page);
    await page.getByRole('button', { name: 'Jogar de novo' }).click();
    const telaCheia = page.locator('[data-kerux-tela-cheia]');
    await expect(telaCheia.getByRole('button', { name: 'Fechar' })).toBeVisible({ timeout: 3_000 });
    await telaCheia.getByRole('button', { name: 'Fechar' }).click();
    await expect.poll(async () => (await state(page)).gameOver).toBe(false);
    expect((await state(page)).score).toBe(0);
  });

  for (const { width, height } of [{ width: 390, height: 844 }, { width: 390, height: 660 }, { width: 375, height: 560 }]) {
    test(`tela cheia do Kerux cabe inteira em ${width}×${height}, em 9:16`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await simularKerux(page);
      await bateMeta(page);
      const anuncio = page.locator('[data-kerux-tela-cheia] [data-kerux]');
      await expect(anuncio).toBeVisible({ timeout: 4_000 });
      const caixa = await anuncio.boundingBox();
      expect(caixa).not.toBeNull();
      expect(caixa!.x).toBeGreaterThanOrEqual(0);
      expect(caixa!.y).toBeGreaterThanOrEqual(0);
      expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(width + 1);
      expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(height + 1);
      expect(caixa!.width / caixa!.height).toBeCloseTo(9 / 16, 2);
    });
  }
});

test.describe('Kerux fallback (quando o Google for liberado)', () => {
  test.beforeEach(async ({ page }) => {
    await modoKerux(page, 'fallback');
  });

  test('banner: AdSense vazio → Kerux no lugar', async ({ page }) => {
    await simularKerux(page);
    await gameOver(page);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(1);
    await expect(page.getByTestId('kerux-banner').getByRole('img', { name: `Kerux ${KERUX!.posicoes.banner}` })).toBeVisible({ timeout: 8_000 });
    expect((await keruxPedidos(page))?.pedidos).toContain('fim-de-fase');
  });

  test('banner: Kerux fora do ar → espaço reservado, sem erro', async ({ page }) => {
    await gameOver(page);
    await page.waitForTimeout(ADS_E_SDK_MS);
    await expect(page.getByText('Espaço do anúncio')).toBeVisible();
  });

  test('fim de nível: Google sem intervalo → tela cheia do Kerux, e o resumo só depois de fechar', async ({ page }) => {
    await simularKerux(page);
    await bateMeta(page);
    const telaCheia = page.locator('[data-kerux-tela-cheia]');
    await expect(telaCheia.getByRole('img', { name: `Kerux ${KERUX!.posicoes.telaCheia}` })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Próximo nível' })).toHaveCount(0);
    await telaCheia.getByRole('button', { name: 'Fechar' }).click();
    await expect(page.getByRole('button', { name: 'Próximo nível' })).toBeVisible();
  });
});
