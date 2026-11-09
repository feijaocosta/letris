import { test, expect, state, chooseGame } from './helpers';
import type { Page } from '@playwright/test';
import pt from '../../locales/pt.json';
import { LOCALES } from '../locales';
import { TUTORIAL_WORDS } from '../../config/tutorial';

// Tutorial da primeira partida do Encaixe: roteiro com tabuleiro e bandeja fixos
test.use({ tutorialSeen: false });

const step = (page: Page) => page.locator('[data-tutorial-step]').getAttribute('data-tutorial-step');
const tutorial = async (page: Page) => (await state(page) as unknown as { tutorial: string | null }).tutorial;
const place = (page: Page, slot: number, row: number, col: number) =>
  page.evaluate(([s, r, c]) => (window as any).__letris.place(s, r, c), [slot, row, col] as const);

async function playEncaixe(page: Page, url = '/', playLabel = pt.home.play) {
  await page.goto(url);
  await chooseGame(page, 'encaixe');
  await page.getByRole('button', { name: playLabel, exact: true }).click();
}

/** Arrasta com o mouse a peça da bandeja até o canto superior esquerdo ficar em (row, col) */
async function dragTo(page: Page, slot: number, row: number, col: number, pieceCols: number) {
  const from = (await page.getByTestId(`encaixe-slot-${slot}`).boundingBox())!;
  const grid = await page.evaluate(() => {
    const r = document.querySelector('.bg-deep .grid')!.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  const pitch = grid.w / 8;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 3);
  await page.mouse.down();
  await page.mouse.move(grid.x + (col + pieceCols / 2) * pitch, grid.y + (row + 1) * pitch + 56, { steps: 10 });
  await page.mouse.up();
}

test('roteiro completo e "Agora é com você!" começa o nível 1 do zero', async ({ page }) => {
  await playEncaixe(page);

  // 1. arrastar uma peça para qualquer lugar
  await expect.poll(() => step(page)).toBe('drag');
  await expect(page.getByText(pt.tutorial.encaixeDrag)).toBeVisible();
  await expect(page.getByTestId('encaixe-slot-0')).toHaveClass(/tutorial-highlight/);
  await dragTo(page, 0, 4, 3, 2);
  // 2. girar a peça do meio
  await expect.poll(() => step(page)).toBe('rotate');
  await expect(page.getByTestId('encaixe-rotate')).toHaveClass(/tutorial-highlight/);
  await page.getByRole('button', { name: pt.encaixe.rotate }).click();
  // 3. palavra na horizontal: SO embaixo, o L vai à direita
  await expect.poll(() => step(page)).toBe('word');
  expect((await state(page)).board[9]).toBe('..SO....');
  await expect(page.getByText('Arraste o L para o lado de SO e forme SOL.')).toBeVisible();
  expect(await place(page, 0, 9, 4)).toBe(true);
  await expect.poll(async () => (await state(page)).found).toEqual(['SOL']);
  // 4. linha
  await expect.poll(() => step(page), { timeout: 4_000 }).toBe('line');
  expect(await place(page, 0, 9, 7)).toBe(true);
  await expect.poll(async () => (await state(page)).lines).toBe(1);
  // 5. meta: MAR na vertical
  await expect.poll(() => step(page), { timeout: 4_000 }).toBe('goal');
  await expect(page.getByText('Na vertical também vale. Solte o R embaixo de MA e forme MAR para bater a meta.')).toBeVisible();
  expect(await place(page, 0, 9, 5)).toBe(true);
  await expect(page.getByRole('heading', { name: pt.tutorial.doneTitle })).toBeVisible({ timeout: 4_000 });
  await expect(page.getByText(pt.tutorial.encaixeDoneText)).toBeVisible();

  await page.getByRole('button', { name: pt.tutorial.doneStart }).click();
  const s = await state(page);
  expect(s.phase).toBe('intro');
  expect(s.level).toBe(1);
  expect(s.score).toBe(0);
  expect(s.lines).toBe(0);
  expect(s.found).toEqual([]);
  expect(await tutorial(page)).toBeNull();
  expect(s.board.every(row => row === '........')).toBe(true);
  expect(s.levelWords).not.toEqual(TUTORIAL_WORDS.pt);
  expect(await page.evaluate(() => localStorage.getItem('letris:tutorialDone:encaixe'))).toBe('true');
  // no tutorial não há recorde nem partida guardada do tutorial
  expect(await page.evaluate(() => localStorage.getItem('letris:bestScore:encaixe:pt'))).toBeNull();
});

test('peça no lugar errado: "Quase! Tente de novo." e o passo recomeça', async ({ page }) => {
  await playEncaixe(page);
  await expect.poll(() => step(page)).toBe('drag');
  await place(page, 0, 0, 0);
  await expect.poll(() => step(page)).toBe('rotate');
  // soltar a peça sem girar repete o passo
  await place(page, 1, 0, 0);
  await expect(page.getByText(pt.tutorial.retry)).toBeVisible();
  expect(await step(page)).toBe('rotate');
  await page.getByRole('button', { name: pt.encaixe.rotate }).click();
  await expect.poll(() => step(page)).toBe('word');
  await place(page, 0, 2, 2); // longe do SO
  await expect(page.getByText(pt.tutorial.retry)).toBeVisible();
  expect(await step(page)).toBe('word');
  expect((await state(page)).board.slice(0, 9).every(row => row === '........')).toBe(true);
  expect((await state(page)).tray).toEqual([['L'], null, null]);
});

test('"Pular" vai direto para o nível 1 e o tutorial não volta', async ({ page }) => {
  await playEncaixe(page);
  await expect.poll(() => step(page)).toBe('drag');
  await page.getByRole('button', { name: pt.tutorial.skip, exact: true }).click();
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);

  await playEncaixe(page, '/', pt.home.newGame);
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);
});

test('quem já tem recorde no Encaixe não vê o tutorial sozinho', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('letris:bestScore:encaixe:pt', '500'));
  await playEncaixe(page);
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  await expect(page.locator('[data-tutorial-step]')).toHaveCount(0);
});

test('cada modo tem o seu tutorial: recorde e tutorial visto do Clássico não pulam o do Encaixe', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('letris:bestScore:pt', '500');
    localStorage.setItem('letris:tutorialDone', 'true');
  });
  await playEncaixe(page);
  await expect.poll(() => step(page)).toBe('drag');
});

test('recorde só do Encaixe não pula o tutorial do Clássico', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('letris:bestScore:encaixe:pt', '500'));
  await page.goto('/');
  await chooseGame(page, 'classic');
  await page.getByRole('button', { name: pt.home.play, exact: true }).click();
  await expect.poll(() => step(page)).toBe('move');
});

test.describe('já viu o tutorial', () => {
  test.use({ tutorialSeen: true });
  test('"Ver tutorial" no Como jogar do Encaixe abre o tutorial do Encaixe', async ({ page }) => {
    await page.goto('/');
    await chooseGame(page, 'encaixe');
    await page.getByRole('button', { name: pt.common.howToPlay }).click();
    await page.getByRole('button', { name: pt.help.tutorial }).click();
    await expect.poll(() => step(page)).toBe('drag');
    expect((await state(page)).mode).toBe('encaixe');
  });

  test('Como jogar do Encaixe explica arrastar, girar e colunas; o do Clássico, os controles', async ({ page }) => {
    await page.goto('/');
    await chooseGame(page, 'encaixe');
    await page.getByRole('button', { name: pt.common.howToPlay }).click();
    for (const text of [pt.help.encaixeLinesTitle, pt.help.encaixeDrag, pt.help.encaixeCancel, pt.help.encaixeRotate, pt.help.encaixeEnd]) {
      await expect(page.getByText(text)).toBeVisible();
    }
    await expect(page.getByText(pt.help.buttonsMove)).toHaveCount(0);
    await expect(page.getByText(pt.help.keyboard)).toHaveCount(0);
    await page.getByRole('button', { name: pt.help.close }).click();

    await page.getByRole('button', { name: pt.common.back }).click();
    await chooseGame(page, 'classic');
    await page.getByRole('button', { name: pt.common.howToPlay }).click();
    await expect(page.getByText(pt.help.keyboard)).toBeVisible();
    await expect(page.getByText(pt.help.encaixeDrag)).toHaveCount(0);
  });
});

for (const [lang, locale] of Object.entries(LOCALES)) {
  test(`em ${lang}: textos do idioma e as duas palavras do tutorial se formam`, async ({ page }) => {
    const [first, second] = TUTORIAL_WORDS[lang as keyof typeof TUTORIAL_WORDS];
    await playEncaixe(page, `/?lang=${lang}`, locale.home.play);
    await expect(page.getByText(locale.tutorial.encaixeDrag)).toBeVisible();
    expect((await state(page)).levelWords).toEqual([first, second]);
    await expect.poll(() => step(page)).toBe('drag');
    await place(page, 0, 0, 0);
    await expect.poll(() => step(page)).toBe('rotate');
    await expect(page.getByText(locale.tutorial.encaixeRotate)).toBeVisible();
    await page.getByRole('button', { name: locale.encaixe.rotate }).click();
    await expect.poll(() => step(page)).toBe('word');
    await place(page, 0, 9, 4);
    await expect.poll(async () => (await state(page)).found).toEqual([first]);
    await expect.poll(() => step(page), { timeout: 4_000 }).toBe('line');
    await expect(page.getByText(locale.tutorial.encaixeLine)).toBeVisible();
    await place(page, 0, 9, 7);
    await expect.poll(() => step(page), { timeout: 4_000 }).toBe('goal');
    await place(page, 0, 9, 5);
    await expect(page.getByRole('heading', { name: locale.tutorial.doneTitle })).toBeVisible({ timeout: 4_000 });
    expect((await state(page)).found).toEqual([first, second]);
  });
}

test.describe('métricas', () => {
  test.use({ consent: 'granted' });
  test('tutorial_start, tutorial_step, tutorial_complete com mode encaixe e sem word_formed', async ({ page }) => {
    await playEncaixe(page);
    await expect.poll(() => step(page)).toBe('drag');
    await place(page, 0, 0, 0);
    await expect.poll(() => step(page)).toBe('rotate');
    await page.getByRole('button', { name: pt.encaixe.rotate }).click();
    await expect.poll(() => step(page)).toBe('word');
    await place(page, 0, 9, 4);
    await expect.poll(() => step(page), { timeout: 4_000 }).toBe('line');
    await page.getByRole('button', { name: pt.tutorial.skip, exact: true }).click();
    const events = await page.evaluate(() => (window.dataLayer ?? []).map(a => Array.from(a as ArrayLike<unknown>))
      .filter(a => a[0] === 'event').map(a => ({ name: a[1] as string, ...(a[2] as Record<string, unknown>) })));
    expect(events.find(e => e.name === 'tutorial_start')).toMatchObject({ mode: 'encaixe' });
    expect(events.filter(e => e.name === 'tutorial_step').map(e => [e.step, e.mode]))
      .toEqual([['drag', 'encaixe'], ['rotate', 'encaixe'], ['word', 'encaixe'], ['line', 'encaixe']]);
    expect(events.find(e => e.name === 'tutorial_skip')).toMatchObject({ step: 'line', mode: 'encaixe' });
    expect(events.map(e => e.name)).not.toContain('word_formed');
  });
});
