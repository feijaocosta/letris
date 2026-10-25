# LETRIS — contexto para o Claude Code

Jogo que mistura Tetris com formação de palavras em português. React 18 + TypeScript + Vite 5 + Tailwind 4 + vite-plugin-pwa. Publicado em https://feijaocosta.github.io/letris/

## Regras de trabalho
- **Sempre criar um branch novo** para qualquer mudança e abrir PR para a `main`. Nunca commitar direto na `main`.
- Conversar em português do Brasil; commits e PRs também em português.
- Antes de abrir PR: `npm ci` + `npm run build` e, se mexer em layout, testar o build servido em `/letris/` em tamanhos de celular (390×844, 390×660, 375×560).

## Estrutura
- `App.tsx` (raiz) e `src/main.tsx` (entrada)
- `components/LetrisGame.tsx` — tela e lógica principal (grid 10×20, teclado, níveis, painéis)
- `components/GameBoard.tsx` — tabuleiro; ocupa a área disponível mantendo 10×20 via container queries
- `components/TetrisPieces.tsx` — formatos das peças e geração de letras
- `components/WordLibrary.tsx` — pools de letras e listas de palavras por nível (fonte única)
- `hooks/usePWA.ts` — só estados online/instalado (NÃO registra Service Worker)
- `styles/globals.css` — tema Tailwind e regras de altura/safe-area
- `components/ui/` — componentes shadcn gerados; evitar mexer

## Decisões já tomadas (não desfazer)
- **Deploy:** `.github/workflows/deploy.yml` faz build e publica `dist/` no branch `gh-pages` a cada push na `main`. `npm run deploy` manual não é mais necessário.
- **Nada de build ou dependências no Git:** `node_modules/`, `dist/`, `dev-dist/` estão no `.gitignore`.
- **Base `/letris/`:** caminhos de assets e Service Worker sempre relativos ao base do Vite.
- **Service Worker:** registrado só pelo vite-plugin-pwa (`injectRegister: 'script'`). Não criar `public/sw.js` nem `public/manifest.json` manuais.
- **CSP:** injetada apenas no build (plugin em `vite.config.ts`); `script-src 'self'` sem scripts inline. `style-src` permite `'unsafe-inline'` por causa dos `style` do React. Headers como X-Frame-Options não funcionam no GitHub Pages.
- **Altura no mobile:** `body` com `position: fixed; inset: 0`; área do jogo `h-full` com classe `.safe-area` (env(safe-area-inset-*)). Não usar `h-screen`, `100vh`, `max-h-screen` nem `-webkit-fill-available`.
- **Tailwind 4:** `bg-opacity-*` não existe; usar `bg-cor/NN` (ex.: `bg-white/20`).
- **Palavras:** listas em ordem alfabética, só em português, e toda palavra deve usar apenas letras do pool do nível. Cada nível precisa ter pelo menos `requiredWords` palavras (Expert exige 15 e tem 15).

## Histórico
- PR #4: issues #1 (SW duplicado), #2 (CSP) e #3 (node_modules commitado)
- PR #5: deploy automático
- PR #6: tabuleiro colapsado (células sem tamanho)
- PR #7: layout cortado no iPhone + botão "?" invisível
- PR #8: POOL mostrava só 6 letras; palavras impossíveis; ordem alfabética; remoção de palavras em inglês

## Pendências / ideias
- Expert ainda tem YOGA, XEROX e QUOTA (aceitas no Brasil, mas YOGA usa Y e XEROX é marca) — decidir se troca.
- Ícones referenciados em `public/icons/` são placeholders.
