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
      // try: páginas internas do navegador (ex.: erro de rede no teste
      // offline) não deixam ler o armazenamento e não devem contar como erro
      try {
        if (sessionStorage.getItem('letris:test-init')) return; // só na primeira carga
        sessionStorage.setItem('letris:test-init', '1');
        if (consent) localStorage.setItem('letris:consent', JSON.stringify(consent));
        localStorage.setItem('letris:controlMode', JSON.stringify(controlMode));
      } catch {
        // sem armazenamento nesta página
      }
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

/**
 * Simula o Kerux Ads (sdk.js, API e CDN) seguindo a API pública do SDK
 * (docs/integracao.md do kerux-ads). Com `anuncio: false`, o Kerux não tem
 * campanha: chama aoFechar na hora e resolve false. Registra em
 * window.__kerux a configuração e as posições pedidas.
 */
export async function simularKerux(page: Page, { anuncio = true } = {}) {
  const sdk = `
    window.__kerux = { config: null, pedidos: [] };
    window.Kerux = {
      init: function (config) {
        window.__kerux.config = config;
        return {
          mostrar: function (posicao, el, op) {
            op = op || {};
            window.__kerux.pedidos.push(posicao);
            if (!${anuncio}) { if (op.aoFechar) op.aoFechar(); return Promise.resolve(false); }
            return fetch('https://kerux.kingdomapps.net/v1/serve?pos=' + posicao).then(function () {
              var raiz = document.createElement('div');
              raiz.setAttribute('data-kerux', posicao);
              raiz.style.cssText = 'position:relative;width:100%;height:100%';
              var a = document.createElement('a');
              a.href = 'https://vitrine.kingdomapps.net';
              a.target = '_blank';
              a.style.cssText = 'display:block;width:100%;height:100%';
              var img = document.createElement('img');
              img.src = 'https://kerux-cdn.kingdomapps.net/pecas/1/1-teste.png';
              img.alt = 'Kerux ' + posicao;
              img.style.cssText = 'width:100%;height:100%';
              a.appendChild(img);
              raiz.appendChild(a);
              if (op.aoFechar) {
                var b = document.createElement('button');
                b.textContent = '×';
                b.setAttribute('aria-label', 'Fechar');
                b.style.cssText = 'position:absolute;top:4px;right:4px';
                b.onclick = function () { raiz.remove(); op.aoFechar(); };
                raiz.appendChild(b);
              }
              el.appendChild(raiz);
              return true;
            });
          }
        };
      }
    };`;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  );
  await page.route('https://kerux.kingdomapps.net/sdk.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: sdk }));
  await page.route('https://kerux.kingdomapps.net/v1/**', route =>
    route.fulfill({ contentType: 'application/json', body: '{}', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route('https://kerux-cdn.kingdomapps.net/**', route =>
    route.fulfill({ contentType: 'image/png', body: png }));
}

/** O que o jogo pediu ao Kerux simulado. */
export const keruxPedidos = (page: Page) =>
  page.evaluate(() => (window as any).__kerux as { config: Record<string, unknown>; pedidos: string[] } | undefined);
