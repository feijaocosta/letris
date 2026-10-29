import { test as base, expect, type Page } from '@playwright/test';

// Base dos testes do jogo:
// - bloqueia tudo que sai do localhost (AdSense, Analytics): o teste não
//   depende de internet e simula o anúncio do Google sem preencher
// - falha o teste se houver erro de JavaScript ou violação da CSP
// - por padrão já responde "Recusar" no aviso de cookies

export interface GameState {
  level: number;
  score: number;
  lines: number;
  phase: 'playing' | 'ending' | 'splash' | 'summary';
  paused: boolean;
  gameOver: boolean;
  levelWords: string[];
  found: string[];
  fallMs: number;
  piece: { x: number; y: number; letters: string[][] } | null;
  board: string[];
}

type Options = { consent: 'granted' | 'denied' | null; controlMode: 'buttons' | 'gestures' };
type Fixtures = { externalRequests: string[] };

export const test = base.extend<Options & Fixtures>({
  consent: ['denied', { option: true }],
  controlMode: ['buttons', { option: true }],
  externalRequests: async ({ page }, use) => {
    const requests: string[] = [];
    await page.route(url => !['localhost', '127.0.0.1'].includes(url.hostname), route => {
      requests.push(route.request().url());
      return route.abort();
    });
    await use(requests);
  },
  page: async ({ page, consent, controlMode }, use) => {
    const problems: string[] = [];
    page.on('pageerror', e => problems.push(`erro de JavaScript: ${e.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) problems.push(`CSP: ${msg.text()}`);
    });
    await page.addInitScript(({ consent, controlMode }) => {
      if (sessionStorage.getItem('letris:test-init')) return; // só na primeira carga
      sessionStorage.setItem('letris:test-init', '1');
      if (consent) localStorage.setItem('letris:consent', JSON.stringify(consent));
      localStorage.setItem('letris:controlMode', JSON.stringify(controlMode));
    }, { consent, controlMode });
    await use(page);
    expect(problems, 'a página não pode ter erros de JavaScript nem de CSP').toEqual([]);
  },
});

export { expect };

/** Abre o jogo, toca em JOGAR e espera a primeira peça. */
export async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /JOGAR/ }).click();
  await expect.poll(() => state(page).then(s => s.piece !== null)).toBe(true);
}

export const state = (page: Page) =>
  page.evaluate(() => (window as any).__letris.state() as GameState);

/** Monta o tabuleiro: cada string é uma linha, alinhadas ao fundo; "." = vazio. */
export const setBoard = (page: Page, rows: string[]) =>
  page.evaluate(rows => (window as any).__letris.setBoard(rows), rows);

/** Troca a peça atual por uma peça horizontal com as letras dadas. */
export const setPiece = (page: Page, letters: string, x: number, y = 0) =>
  page.evaluate(([letters, x, y]) => (window as any).__letris.setPiece(letters, x, y), [letters, x, y] as const);

/** Troca a lista de palavras do nível (as únicas que valem). */
export const setLevelWords = (page: Page, words: string[]) =>
  page.evaluate(words => (window as any).__letris.setLevelWords(words), words);

/** Solta a peça (barra de espaço). */
export const drop = (page: Page) => page.keyboard.press('Space');

export const LIST = ['LUA', 'RIO', 'SAL', 'TIA', 'REI', 'MAR'];
