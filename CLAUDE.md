# LETRIS — contexto para o Claude Code

Jogo que mistura Tetris com formação de palavras em português. React 18 + TypeScript + Vite 5 + Tailwind 4 + vite-plugin-pwa. Publicado em https://letris.kingdomapps.net (domínio próprio; https://feijaocosta.github.io/letris/ redireciona para ele)

## Regras de trabalho
- **Sempre criar um branch novo** para qualquer mudança e abrir PR para a `main`. Nunca commitar direto na `main`.
- Conversar em português do Brasil; commits e PRs também em português.
- Antes de abrir PR: `npm ci` + `npm run build` e, se mexer em layout, testar o build servido na raiz `/` em tamanhos de celular (390×844, 390×660, 375×560).

## Estrutura
- `App.tsx` (raiz: alterna entrada/jogo, abre "Como jogar", guarda o modo de controle) e `src/main.tsx` (entrada)
- `components/HomeScreen.tsx` — tela de entrada (recorde, melhor nível, escolha Botões/Gestos, JOGAR)
- `components/LetrisGame.tsx` — tela e lógica do jogo (grid 10×20, teclado, botões, gestos, níveis)
- `components/GameOverlays.tsx` — pausa, nível concluído e fim de jogo (essas duas com anúncio)
- `components/HelpScreen.tsx` — "Como jogar"
- `components/LetrisUI.tsx` — blocos de letra (`Tile`), logo, cartões, seletor de controle e ícones SVG
- `components/GameBoard.tsx` — tabuleiro; ocupa a área disponível mantendo 10×20 via container queries
- `components/TetrisPieces.tsx` — formatos, cores e letras das peças
- `hooks/useBoardGestures.ts` — deslizar move, tocar gira, arrastar ↓ acelera
- `config/ads.ts` + `lib/ads.ts` + `components/AdBanner.tsx` — AdSense (Ad Placement API entre rodadas + banner 300×250)
- `lib/storage.ts` — preferências e recordes no localStorage (prefixo `letris:`)
- `components/WordLibrary.tsx` — pools de letras e listas de palavras por nível (fonte única)
- `hooks/usePWA.ts` — só estados online/instalado (NÃO registra Service Worker)
- `hooks/useAppUpdate.ts` + `components/UpdateBanner.tsx` — detecta versão nova e mostra botão "Atualizar"
- `styles/globals.css` — tema Tailwind e regras de altura/safe-area
- `components/ui/` — componentes shadcn gerados; evitar mexer

## Decisões já tomadas (não desfazer)
- **Deploy:** `.github/workflows/deploy.yml` faz build e publica `dist/` no branch `gh-pages` a cada push na `main`. `npm run deploy` manual não é mais necessário.
- **Nada de build ou dependências no Git:** `node_modules/`, `dist/`, `dev-dist/` estão no `.gitignore`.
- **Domínio e base:** o site roda em `letris.kingdomapps.net` com base `/` (manifest `start_url`/`scope` também `/`). O workflow de deploy grava o CNAME (`cname:` no peaceiris). Caminhos de assets e Service Worker sempre relativos ao base do Vite.
- **Service Worker:** registrado só pelo vite-plugin-pwa (`injectRegister: 'script'`). Não criar `public/sw.js` nem `public/manifest.json` manuais.
- **Versão/atualização:** o build gera `dist/version.json` (fora do precache) e embute `__APP_VERSION__`. O app compara os dois ao abrir, ao voltar do segundo plano e a cada 5 min; "Atualizar" remove o SW e os caches e recarrega.
- **Botões de controle:** agem SÓ no `onPointerDown`. Não adicionar `onClick` nem `onTouchStart`: no celular o click chega ao soltar o dedo e a peça anda duas vezes.
- **Visual:** paleta do ícone (fundo `ink` #2a1f38, `panel`, `deep`, blocos azul/amarelo/vermelho/laranja/verde) definida no `@theme` do `globals.css`; as cores dos blocos ficam em `@theme static` porque são usadas via `var()`. Fonte Nunito local (`@fontsource-variable/nunito`), sem Google Fonts por causa da CSP. Ícones são SVG inline, sem emoji.
- **Controles:** dois modos (Botões/Gestos), escolhidos na entrada ou na pausa e salvos no aparelho. Os gestos no tabuleiro funcionam nos dois modos; no modo Gestos os botões somem e o tabuleiro cresce. Arrastar para baixo acelera (não solta).
- **Anúncios:** Ad Placement API (`adBreak` type `next`) ao avançar de nível e ao "Jogar de novo"; banner 300×250 nas telas de nível concluído e fim de jogo. Tudo desligado enquanto `ADS.client` em `config/ads.ts` estiver vazio. Com o client preenchido o build libera os domínios do Google na CSP e gera `/ads.txt`.
- **Palavras e linhas:** são procuradas no mesmo tabuleiro e removidas juntas (`resolveBoard`), e a próxima peça só nasce depois disso.
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
- PR #10: toque duplo (parcial), palavra + linha juntas, aviso de nova versão
- PR #11: toque duplo (de vez: só pointerdown) e domínio letris.kingdomapps.net
- PR #13: ativa AdSense (client, bloco do banner, CSP e ads.txt)
- PR #12: layout novo (entrada, jogo, pausa, ajuda, fim de nível/jogo), modos Botões/Gestos, recordes e estrutura de anúncios

## Pendências / ideias
- AdSense ativo (`ca-pub-2445285097738073`, bloco 300×250 `1660743556`). Anúncios entre rodadas dependem da aprovação do H5 Games Ads (pedida à parte); até lá o `adBreak` não mostra nada e o jogo segue.
- `ads.txt` também precisa estar na raiz `kingdomapps.net` (repo `fcwwebsites/kingdomapps-hotsite-kingdomapps`).
- Expert ainda tem YOGA, XEROX e QUOTA (aceitas no Brasil, mas YOGA usa Y e XEROX é marca) — decidir se troca.
- Ícones referenciados em `public/icons/` são placeholders.
