import { test, expect, startGame, state, setPiece, setBoard, setLevelWords, drop, LIST } from './helpers';

// PR #20: ao bater a meta, congela com a palavra brilhando, mostra a
// comemoração com as palavras, chama o anúncio e só então o resumo.
test('fim de nível: comemoração, resumo e próximo nível na hora', async ({ page }) => {
  await startGame(page);
  await setLevelWords(page, LIST);
  // 4 palavras prontas + a 5ª completada pela peça (meta do nível 1 = 5)
  await setBoard(page, ['LU........', 'RIO.......', 'SAL.......', 'TIA.......', 'REI.......']);
  await setPiece(page, 'A', 2);
  await drop(page);

  await expect.poll(async () => (await state(page)).phase).toBe('ending');
  await page.waitForTimeout(300);
  expect((await state(page)).piece, 'durante o brilho nenhuma peça nasce').toBeNull();

  await expect(page.getByText('Meta batida!')).toBeVisible({ timeout: 2_000 });
  for (const w of ['LUA', 'RIO', 'SAL', 'TIA', 'REI']) await expect(page.getByText(w, { exact: true }).first()).toBeVisible();

  // Sem o script do Google (bloqueado no teste) o anúncio desiste em até 3 s
  const next = page.getByRole('button', { name: 'Próximo nível' });
  await expect(next).toBeVisible({ timeout: 8_000 });
  await next.click();
  await expect.poll(async () => (await state(page)).level, { timeout: 1_000 }).toBe(2);
  const s = await state(page);
  expect(s.phase).toBe('playing');
  expect(s.found).toEqual([]);
  expect(s.board.every(row => row === '..........')).toBe(true);
});

test('fim de jogo quando a peça não cabe mais', async ({ page }) => {
  await startGame(page);
  await setLevelWords(page, LIST);
  await setBoard(page, Array(19).fill('ZZZZ.ZZZZZ'));
  await drop(page);
  await expect(page.getByRole('button', { name: 'Jogar de novo' })).toBeVisible({ timeout: 5_000 });
});
