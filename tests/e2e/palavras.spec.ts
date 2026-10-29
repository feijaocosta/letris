import { test, expect, startGame, state, setPiece, setBoard, setLevelWords, drop, LIST } from './helpers';

// Palavras de 3 letras do nível 1 que podem ou não ter sido sorteadas
const COMMON = ['SOL', 'LUA', 'REI', 'RIO', 'SAL', 'TIA', 'TIO', 'ANO', 'ERA', 'LER', 'SER', 'TAL', 'RUA', 'NUA', 'OLA'];

test('palavra fora da lista fica no tabuleiro e não pontua, como num caça-palavras (PR #20)', async ({ page }) => {
  // Usa a lista sorteada de verdade (sem trocar), para testar o sorteio do nível
  await startGame(page);
  const { levelWords } = await state(page);
  const outside = COMMON.find(w => !levelWords.includes(w))!;
  await setBoard(page, [outside.slice(0, 2) + '........']);
  await setPiece(page, outside[2], 2);
  await drop(page);
  await page.waitForTimeout(1500);
  const s = await state(page);
  expect(s.found).toEqual([]);
  expect(s.board[19]).toBe(outside + '.......');
});

test.describe('com a lista do nível fixa', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page);
    await setLevelWords(page, LIST);
  });

  test('palavra da lista some, pontua e conta para a meta', async ({ page }) => {
    await setBoard(page, ['RI........']);
    await setPiece(page, 'O', 2);
    const before = (await state(page)).score;
    await drop(page);
    await expect.poll(async () => (await state(page)).found).toEqual(['RIO']);
    expect((await state(page)).score).toBeGreaterThan(before + 50);
    await expect.poll(async () => (await state(page)).board[19]).toBe('..........');
  });

  test('palavra e linha no mesmo encaixe contam as duas (PR #10)', async ({ page }) => {
    await setBoard(page, ['LUAZZZZZZ.']);
    await setPiece(page, 'Z', 9);
    await drop(page);
    await expect.poll(async () => (await state(page)).found).toEqual(['LUA']);
    expect((await state(page)).lines).toBe(1);
    await expect(page.getByText('Palavra + linha')).toBeVisible();
  });

  test('a próxima peça só nasce depois de limpar o tabuleiro', async ({ page }) => {
    await setBoard(page, ['RI........']);
    await setPiece(page, 'O', 2);
    await drop(page);
    await page.waitForTimeout(400);
    expect((await state(page)).piece).toBeNull();
    await expect.poll(async () => (await state(page)).piece !== null).toBe(true);
  });
});
