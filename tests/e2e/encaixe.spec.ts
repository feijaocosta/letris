import { test, expect, chooseGame, state, setBoard, setLevelWords, LIST } from './helpers';
import type { Page } from '@playwright/test';
import pt from '../../locales/pt.json';

// Modo Encaixe: arrastar peças da bandeja e soltar onde quiser (sem gravidade)

const setTray = (page: Page, pieces: Array<string[] | null>) =>
  page.evaluate(p => (window as any).__letris.setTray(p), pieces);
const place = (page: Page, slot: number, row: number, col: number) =>
  page.evaluate(([s, r, c]) => (window as any).__letris.place(s, r, c), [slot, row, col] as const);

async function startEncaixe(page: Page) {
  await page.goto('/');
  await chooseGame(page, 'encaixe');
  await page.getByRole('button', { name: pt.home.play, exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__letris?.state().mode)).toBe('encaixe');
  await page.evaluate(() => (window as any).__letris.skipIntro());
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
}

/** Arrasta a peça da bandeja com o mouse até o canto superior esquerdo ficar em (row, col) */
async function dragTo(page: Page, slot: number, row: number, col: number, pieceRows: number, pieceCols: number, release = true) {
  const from = (await page.getByTestId(`encaixe-slot-${slot}`).boundingBox())!;
  const grid = await page.evaluate(() => {
    const r = document.querySelector('.bg-deep .grid')!.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  const pitch = grid.w / 8;
  // A peça fica centralizada no dedo e 56 px acima dele
  const x = grid.x + (col + pieceCols / 2) * pitch;
  const y = grid.y + (row + pieceRows) * pitch + 56;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 10 });
  if (release) await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await startEncaixe(page);
  await setLevelWords(page, LIST);
});

test('arrastar e soltar: a peça fica exatamente onde foi solta e a bandeja repõe só ela', async ({ page }) => {
  await setBoard(page, []);
  await setTray(page, [['AB'], ['X'], ['YZ']]);
  await dragTo(page, 0, 3, 2, 1, 2);
  const s = await state(page);
  expect(s.board[3]).toBe('..AB....');
  expect(s.board[9], 'nada caiu').toBe('........');
  expect(s.score).toBe(2); // 1 ponto por bloco
  expect(s.tray[0]).not.toEqual(['AB']);
  expect(s.tray[1]).toEqual(['X']);
  expect(s.tray[2]).toEqual(['YZ']);
});

test('enquanto arrasta, mostra a peça no lugar e o que vai sumir', async ({ page }) => {
  await setLevelWords(page, ['SOL', ...LIST]);
  await setBoard(page, ['SO......']);
  await setTray(page, [['L'], ['X'], ['YZ']]);
  await dragTo(page, 0, 9, 2, 1, 1, false);
  await expect(page.locator('.bg-deep .tile-glow')).toHaveCount(3); // S O L brilhando
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).found).toEqual(['SOL']);
  await expect(page.locator('.bg-deep .tile-glow')).toHaveCount(0, { timeout: 2_000 });
});

test('soltar fora do tabuleiro ou em cima de outra peça devolve para a bandeja', async ({ page }) => {
  await setBoard(page, ['ZZ......']);
  await setTray(page, [['AB'], ['X'], ['YZ']]);
  const before = await state(page);
  // em cima de ZZ
  await dragTo(page, 0, 9, 0, 1, 2);
  // fora: solta lá em cima, no placar
  const from = (await page.getByTestId('encaixe-slot-0').boundingBox())!;
  await page.mouse.move(from.x + 20, from.y + 20);
  await page.mouse.down();
  await page.mouse.move(200, 20, { steps: 8 });
  await page.mouse.up();
  const after = await state(page);
  expect(after.board).toEqual(before.board);
  expect(after.tray[0]).toEqual(['AB']);
  expect(after.score).toBe(before.score);
});

test('linha completa some e o que está em cima não desce', async ({ page }) => {
  await setBoard(page, ['.Q......', 'ZZZZZZZ.']);
  await setTray(page, [['Z'], ['X'], ['YZ']]);
  await place(page, 0, 9, 7);
  await expect.poll(async () => (await state(page)).lines).toBe(1);
  await expect.poll(async () => (await state(page)).board[9]).toBe('........');
  expect((await state(page)).board[8]).toBe('.Q......');
});

test('coluna completa some', async ({ page }) => {
  await setBoard(page, Array(9).fill('Z.......'));
  await setTray(page, [['Z'], ['X'], ['YZ']]);
  await place(page, 0, 0, 0);
  await expect.poll(async () => (await state(page)).lines).toBe(1);
  await expect.poll(async () => (await state(page)).board.every(r => r === '........')).toBe(true);
});

test('botão de girar só na peça do meio: gira e a peça girada encaixa', async ({ page }) => {
  await setTray(page, [['AB'], ['SOL', '.A.'], ['CD']]);
  await expect(page.getByTestId('encaixe-rotate')).toHaveCount(1);
  await expect(page.getByTestId('encaixe-slot-1').getByTestId('encaixe-rotate')).toBeVisible();
  await page.getByRole('button', { name: pt.encaixe.rotate }).click();
  expect((await state(page)).tray).toEqual([['AB'], ['.S', 'AO', '.L'], ['CD']]);
  // tocar no botão não começa a arrastar nem muda as outras peças
  await expect(page.getByTestId('encaixe-slot-1').locator('.opacity-20')).toHaveCount(0);
  expect(await place(page, 1, 7, 0)).toBe(true);
  const board = (await state(page)).board;
  expect(board.slice(7)).toEqual(['.S......', 'AO......', '.L......']);
});

test('PR #31: o botão de girar não cobre a peça, nem a de 4 blocos em pé', async ({ page }) => {
  for (const pieceRows of [['S', 'S', 'L', 'O'], ['SSLO']]) {
    await setTray(page, [['AB'], pieceRows, ['CD']]);
    const overlaps = await page.evaluate(() => {
      const slot = document.querySelector('[data-testid="encaixe-slot-1"]')!;
      const button = slot.querySelector('[data-testid="encaixe-rotate"]')!.getBoundingClientRect();
      const tiles = Array.from(slot.querySelectorAll('.grid > *')).map(el => el.getBoundingClientRect());
      const slotBox = slot.getBoundingClientRect();
      return {
        tiles: tiles.length,
        hit: tiles.some(t => t.bottom > button.top && t.top < button.bottom && t.right > button.left && t.left < button.right),
        inside: tiles.every(t => t.top >= slotBox.top && t.bottom <= slotBox.bottom && t.left >= slotBox.left && t.right <= slotBox.right),
      };
    });
    expect(overlaps).toEqual({ tiles: 4, hit: false, inside: true });
  }
});

// Xadrez: nenhuma casa vazia tem vizinha vazia, então só peça de 1 bloco cabe
const CHECKER = Array.from({ length: 10 }, (_, i) => (i % 2 ? '.Z.Z.Z.Z' : 'Z.Z.Z.Z.'));

test('fim de jogo quando nenhuma peça da bandeja cabe', async ({ page }) => {
  await setBoard(page, CHECKER);
  await setTray(page, [['AB'], ['C', 'D'], ['EF']]);
  await page.evaluate(() => (window as any).__letris.checkGameOver());
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toBeVisible();
  await expect(page.getByText('Não cabe mais nenhuma peça no nível 1')).toBeVisible();
  // recorde do Encaixe, separado do Clássico
  expect(await page.evaluate(() => localStorage.getItem('letris:bestLevel:encaixe:pt'))).toBe('1');
  expect(await page.evaluate(() => localStorage.getItem('letris:bestLevel:pt'))).toBeNull();
});

test('a peça do meio só trava o jogo se não couber em nenhuma posição', async ({ page }) => {
  // Só cabe peça em pé: a coluna 0 livre de cima a baixo, o resto cheio
  await setBoard(page, Array.from({ length: 10 }, () => '.ZZZZZZZ'));
  await setTray(page, [['AB'], ['CD'], ['EF']]);
  await page.evaluate(() => (window as any).__letris.checkGameOver());
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toHaveCount(0);
  // a do meio deitada não cabe, mas em pé cabe; as dos lados não giram
  await page.getByRole('button', { name: pt.encaixe.rotate }).click();
  expect(await place(page, 1, 0, 0)).toBe(true);
});

test('enquanto uma peça cabe, o jogo continua', async ({ page }) => {
  await setBoard(page, CHECKER);
  await setTray(page, [['AB'], ['C'], ['EF']]);
  await page.evaluate(() => (window as any).__letris.checkGameOver());
  await expect(page.getByRole('button', { name: pt.gameOver.playAgain })).toHaveCount(0);
});

test('meta do nível: comemoração, resumo e nível 2 com tabuleiro limpo', async ({ page }) => {
  await setBoard(page, ['LU......', 'RIO.....', 'SAL.....', 'TIA.....', 'REI.....']);
  await setTray(page, [['A'], ['X'], ['YZ']]);
  await place(page, 0, 5, 2);
  await expect(page.getByText(pt.levelSplash.title)).toBeVisible({ timeout: 3_000 });
  await page.getByRole('button', { name: pt.levelComplete.continue }).click({ timeout: 8_000 });
  await expect.poll(async () => (await state(page)).level).toBe(2);
  const s = await state(page);
  expect(s.phase).toBe('intro');
  expect(s.board.every(r => r === '........')).toBe(true);
  expect(s.tray.every(p => p !== null)).toBe(true);
});

test('partida guardada do Encaixe: pausar, recarregar e continuar igual', async ({ page }) => {
  await setBoard(page, ['ZZ......']);
  await setTray(page, [['AB'], ['C'], ['DE']]);
  await place(page, 1, 5, 5);
  await page.getByRole('button', { name: pt.game.pause }).click();
  const before = await state(page);
  await page.reload();
  // abre na escolha, com o selo "Em andamento" só no Encaixe
  await expect(page.getByTestId('mode-encaixe')).toContainText(pt.modes.inProgress);
  await expect(page.getByTestId('mode-classic')).not.toContainText(pt.modes.inProgress);
  await chooseGame(page, 'encaixe');
  await page.getByRole('button', { name: new RegExp(pt.home.continue) }).click();
  await expect(page.getByRole('button', { name: pt.pause.resume })).toBeVisible();
  const after = await state(page);
  expect(after.board).toEqual(before.board);
  expect(after.tray).toEqual(before.tray);
  expect(after.score).toBe(before.score);
});

test.describe('entrada', () => {
  test('no Encaixe o seletor Botões/Gestos some; no Clássico aparece; ← volta para a escolha', async ({ page }) => {
    await page.goto('/');
    await chooseGame(page, 'encaixe');
    await expect(page.getByRole('heading', { name: pt.modes.encaixe })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: pt.controls.label })).toHaveCount(0);
    await page.getByRole('button', { name: pt.common.back }).click();
    await chooseGame(page, 'classic');
    await expect(page.getByRole('heading', { name: pt.modes.classic })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: pt.controls.label })).toBeVisible();
  });

  test('"Voltar ao início" na pausa leva para a escolha do jogo', async ({ page }) => {
    await page.getByRole('button', { name: pt.game.pause }).click();
    await page.getByRole('button', { name: pt.pause.home }).click();
    await expect(page.getByTestId('mode-encaixe')).toBeVisible();
  });

  for (const size of [{ width: 390, height: 844 }, { width: 390, height: 660 }, { width: 375, height: 560 }]) {
    test(`jogo em ${size.width}×${size.height}: tabuleiro, palavras e bandeja cabem`, async ({ page }) => {
      // já dentro da partida (beforeEach): só muda o tamanho da tela
      await page.setViewportSize(size);
      await page.waitForTimeout(200);
      const box = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
      const board = await box('.bg-deep');
      const tray = await box('[data-testid="encaixe-tray"]');
      expect(board.width).toBeGreaterThan(150);
      expect(Math.round((board.height / board.width) * 8)).toBe(10);
      expect(board.y + board.height).toBeLessThanOrEqual(tray.y);
      expect(tray.y + tray.height).toBeLessThanOrEqual(size.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    });
  }
});
