# LETRIS — contexto para o Claude Code

Jogo que mistura Tetris com formação de palavras, em português e inglês (espanhol e francês planejados). React 18 + TypeScript + Vite 5 + Tailwind 4 + vite-plugin-pwa. Publicado em https://letris.kingdomapps.net (domínio próprio; https://feijaocosta.github.io/letris/ redireciona para ele)

## Regras de trabalho
- **Sempre criar um branch novo** para qualquer mudança e abrir PR para a `main`. Nunca commitar direto na `main`.
- Conversar em português do Brasil; commits e PRs também em português.
- Antes de abrir PR: `npm ci` + `npm run typecheck` + `npm run build` + `npm test` (testes de regressão, ver `tests/README.md`) e, se mexer em layout, testar o build servido na raiz `/` em tamanhos de celular (390×844, 390×660, 375×560).
- **Todo bug corrigido ganha um teste de regressão** em `tests/` (com o número do PR no nome) que falha sem a correção. Mudança de regra do jogo atualiza o teste correspondente.
- **Antes de começar cada sprint/PR, explicar o que será feito e esperar o OK do Feijão.**
- **O Feijão testa localmente antes de mesclar.** No PR, dizer o nome do branch e o que conferir à mão.

## Estrutura
- `App.tsx` (raiz: alterna entrada/jogo, abre "Como jogar", guarda o modo de controle) e `src/main.tsx` (entrada)
- `components/HomeScreen.tsx` — tela de entrada (recorde, melhor nível, escolha Botões/Gestos, JOGAR)
- `components/LetrisGame.tsx` — tela e lógica do jogo (grid 10×20, teclado, botões, gestos, níveis)
- `components/GameOverlays.tsx` — pausa, nível concluído e fim de jogo (essas duas com anúncio)
- `components/HelpScreen.tsx` — "Como jogar"
- `components/LetrisUI.tsx` — blocos de letra (`Tile`), logo, cartões, seletor de controle e ícones SVG
- `components/GameBoard.tsx` — tabuleiro; mede a área disponível (ResizeObserver) e ocupa o máximo mantendo 10×20
- `components/TetrisPieces.tsx` — formatos, cores e letras das peças
- `hooks/useBoardGestures.ts` — deslizar move, tocar gira, arrastar ↓ acelera
- `config/ads.ts` + `lib/ads.ts` + `components/AdBanner.tsx` — AdSense (Ad Placement API entre rodadas + banner 300×250)
- `config/analytics.ts` + `lib/analytics.ts` — Google Analytics 4 (`G-1YMLTC0J79`) e `track()` dos eventos
- `lib/consent.ts` + `components/ConsentBanner.tsx` + `public/privacidade.html` — consentimento de cookies (LGPD) e política de privacidade
- `lib/i18n.tsx` + `locales/<idioma>.json` (pt, en) — textos da interface: `useI18n()` devolve `t('grupo.chave', { variáveis })`, `rich()` (texto com destaque) e `n()` (números no formato do idioma); validados por `scripts/check-locales.mjs` no `npm run build`
- `lib/storage.ts` — preferências e recordes no localStorage (prefixo `letris:`); recordes por idioma (`bestScore:pt`, `bestLevel:pt`)
- `config/languages.json` + `config/languages.ts` — idiomas do jogo (código, nome, locale, alfabeto, vogais, `extraVowels`); ordem do seletor
- `data/words/<idioma>.json` — banco de palavras (por tamanho) e progressão dos níveis de cada idioma (letras novas, mistura de tamanhos, meta); validado por `scripts/check-words.mjs` no `npm run build`
- `lib/normalize.mjs` — `normalizeWord(palavra, idioma)`: maiúsculas sem acento, Ñ preservado no espanhol, Œ→OE
- `components/WordLibrary.tsx` — classe com o banco de UM idioma: letras do nível, sorteio da lista do nível e gerador de letras com peso
- `lib/wordBanks.ts` — `loadWordLibrary(idioma)`: carrega o banco sob demanda (import dinâmico, um .js por idioma no precache)
- `config/gameplay.ts` — números de velocidade e pontuação (ajustar aqui)
- `components/ScoreSystem.tsx` — cálculo de pontos e velocidade a partir de `config/gameplay.ts`
- `hooks/usePWA.ts` — só estados online/instalado (NÃO registra Service Worker)
- `hooks/useAppUpdate.ts` + `components/UpdateBanner.tsx` — detecta versão nova e mostra botão "Atualizar"
- `styles/globals.css` — tema Tailwind e regras de altura/safe-area
- `components/ui/` — componentes shadcn gerados; evitar mexer
- `tsconfig.check.json` — `npm run typecheck` (tudo menos `components/ui/`, que tem erros antigos)
- `tests/` + `playwright.config.ts` — testes de regressão (lógica sem navegador e o jogo no Chromium/WebKit); `.github/workflows/testes.yml` roda em todo PR

## Decisões já tomadas (não desfazer)
- **Deploy:** `.github/workflows/deploy.yml` faz build e publica `dist/` no branch `gh-pages` a cada push na `main`. `npm run deploy` manual não é mais necessário.
- **Nada de build ou dependências no Git:** `node_modules/`, `dist/`, `dev-dist/` estão no `.gitignore`.
- **Domínio e base:** o site roda em `letris.kingdomapps.net` com base `/` (manifest `start_url`/`scope` também `/`). O workflow de deploy grava o CNAME (`cname:` no peaceiris). Caminhos de assets e Service Worker sempre relativos ao base do Vite.
- **Service Worker:** registrado só pelo vite-plugin-pwa (`injectRegister: 'script'`). Não criar `public/sw.js` nem `public/manifest.json` manuais.
- **Versão/atualização:** o build gera `dist/version.json` (fora do precache) e embute `__APP_VERSION__`. O app compara os dois ao abrir, ao voltar do segundo plano e a cada 5 min; "Atualizar" remove o SW e os caches e recarrega.
- **Botões de controle:** agem SÓ no `onPointerDown`. Não adicionar `onClick` nem `onTouchStart`: no celular o click chega ao soltar o dedo e a peça anda duas vezes.
- **Visual:** paleta do ícone (fundo `ink` #2a1f38, `panel`, `deep`, blocos azul/amarelo/vermelho/laranja/verde) definida no `@theme` do `globals.css`; as cores dos blocos ficam em `@theme static` porque são usadas via `var()`. Fonte Nunito local (`@fontsource-variable/nunito`), sem Google Fonts por causa da CSP. Ícones são SVG inline, sem emoji.
- **Controles:** dois modos (Botões/Gestos), escolhidos na entrada ou na pausa e salvos no aparelho. Os gestos no tabuleiro funcionam nos dois modos; no modo Gestos os botões somem e o tabuleiro cresce. Arrastar para baixo acelera (não solta).
- **Anúncios:** Ad Placement API (`adBreak` type `next`) no fim de cada nível (depois da comemoração, antes do resumo) e ao "Jogar de novo"; banner 300×250 nas telas de nível concluído e fim de jogo. Tudo desligado enquanto `ADS.client` em `config/ads.ts` estiver vazio. Se o AdSense não preencher o banner (`data-ad-status` ≠ `filled` em até `bannerTimeoutMs`), aparece o anúncio próprio `HOUSE_AD` (imagem em `public/ads/`, link para https://vitrine.kingdomapps.net) — só em português; nos outros idiomas aparece o espaço reservado até existir a arte do idioma. Com o client preenchido o build libera os domínios do Google na CSP e gera `/ads.txt`.
- **Métricas e consentimento:** GA4 só é carregado depois de "Aceitar" no aviso de cookies (sem resposta = recusado). Sem aceite, o AdSense recebe `requestNonPersonalizedAds = 1`. O aviso aparece na entrada até a escolha e reabre pelo link "Privacidade". Em localhost/dev os eventos vão só para `window.dataLayer` (o script do Google não carrega). Eventos: `game_start`, `word_formed`, `level_complete`, `game_over`, `control_mode_change`, `language_change`, `help_open`, `house_ad_click`, `ad_break_shown`, `pwa_install`, `app_update`. Todo evento leva `game_language` (idioma do jogo; não usar `language`, que o GA4 já usa para o idioma do aparelho) e `game_version` (`__APP_VERSION__`), também gravados como propriedades do usuário; precisam estar registrados como dimensões personalizadas no GA4. Sem dados pessoais.
- **Velocidade e gravidade:** 1000 ms/linha no nível 1, −60 ms por nível, −20 ms a cada 30 s jogados no nível (no máx. −100, zera a cada nível), mínimo 250 ms. O tempo conta só o jogo rodando (`playedMsRef`). O relógio de queda é por peça e não recomeça quando a peça gira ou anda para os lados.
- **Pontuação:** palavra nova 100/150/220/300 (3/4/5/6+ letras), repetida metade, combo ×1,5/×2, cascata +50%, palavra + linha +50%, linhas 50/120/250/500, soltar +1 por linha, fim de nível 300 × nível, multiplicador 1 + 0,2 × (nível − 1). Pontos somados na detecção e mostrados no tabuleiro.
- **Palavras por nível:** cada nível sorteia a lista (mistura de tamanhos em `data/words/<idioma>.json`) sem repetir palavras já sorteadas na partida. Como num caça-palavras, só valem as palavras da lista do nível: outras palavras do banco, mesmo formadas, não somem nem pontuam. Quando uma palavra está dentro de outra na mesma linha/coluna, vale só a maior. ~60% das letras vêm das palavras que faltam, e nunca saem mais de 3 consoantes seguidas.
- **Fim de nível:** ao bater a meta o jogo congela com a palavra brilhando (~0,9 s), abre a comemoração "Meta batida!" com as palavras do nível (~1,6 s), chama o anúncio entre rodadas e só então mostra o resumo. "Próximo nível" começa na hora.
- **Palavras e linhas:** são procuradas no mesmo tabuleiro e removidas juntas (`resolveBoard`), e a próxima peça só nasce depois disso.
- **CSP:** injetada apenas no build (plugin em `vite.config.ts`); `script-src 'self'` sem scripts inline. `style-src` permite `'unsafe-inline'` por causa dos `style` do React. Headers como X-Frame-Options não funcionam no GitHub Pages.
- **Altura no mobile:** `body` com `position: fixed; inset: 0`; área do jogo `h-full` com classe `.safe-area` (env(safe-area-inset-*)). Não usar `h-screen`, `100vh`, `max-h-screen` nem `-webkit-fill-available`.
- **Ícone:** o oficial é `public/pwa-512x512.png` (blocos coloridos formando LETRIS). `pwa-192x192.png`, `apple-touch-icon.png` (180), `favicon-32x32.png` e `favicon.ico` são gerados a partir dele; não usar outro desenho.
- **Tamanho do tabuleiro:** calculado em px com ResizeObserver. Não voltar para container queries (`cqh`): o Safari do iPhone não atualizava quando a lista de palavras crescia e o tabuleiro cobria as palavras.
- **Testes:** Playwright (`@playwright/test` com versão fixa). Os testes do jogo usam o build com `LETRIS_E2E=1` (`dist-e2e/`), que expõe `window.__letris` (estado, montar tabuleiro, trocar peça e lista do nível); no build publicado `__E2E__` é `false` e o gancho some. Não testar mexendo nos internos do React.
- **Textos (i18n):** nenhum texto de interface escrito direto nos componentes; tudo em `locales/pt.json` (idioma de referência) e lido com `t()`. Chaves em inglês, camelCase, agrupadas por tela (`home.play`, `levelComplete.title`). Solução própria, sem biblioteca. Rótulos da pontuação saem do `ScoreSystem` como chaves; os nomes dos grupos de níveis em `data/words/*.json` (`basic`, `intermediate`...) são traduzidos em `pools.*`. O build falha com chave inexistente, chave faltando em outro idioma ou variáveis diferentes do PT. Valores de métricas (ex.: `navegador`) são dados, não texto de tela.
- **Idioma:** idiomas prontos = os de `config/languages.json`. Ao abrir, `?lang=` (salva a escolha e sai da URL) → idioma salvo (`letris:lang`) → idiomas do navegador → inglês, se pronto → português. Só idiomas prontos (com locale e banco) entram. O seletor fica na entrada e só aparece com 2 idiomas ou mais; trocar idioma nunca no meio da partida. `<html lang>` e o título acompanham. Recordes separados por idioma; os antigos (sem idioma) foram migrados uma vez para `:pt`.
- **Tailwind 4:** `bg-opacity-*` não existe; usar `bg-cor/NN` (ex.: `bg-white/20`).
- **Palavras:** em `data/words/<idioma>.json`, MAIÚSCULAS sem acento (Ç→C; Ñ é letra própria no espanhol; Œ→OE no francês), igual a `normalizeWord`, só letras do `alphabet` do idioma, em NFC, ordem alfabética do idioma (`localeCompare` com o locale), sem marcas nem nomes próprios; o build falha se alguma regra quebrar, se um nível não tiver palavras suficientes ou se um idioma de `config/languages.json` não tiver banco e locale.
- **Inglês:** progressão de letras AEIOURSTNL → D → HM → CY → PB → GW → FK → V → JZ → QX, mesma mistura de tamanhos e metas do PT. `Y` é `extraVowels`: quebra a sequência de consoantes (SKY, FLY, GYM), mas não é sorteado como vogal forçada.
- **Banco por idioma:** carregado com `import()` antes da partida (pré-carregado na entrada); nunca ler o JSON com `fetch` (`.json` não entra no precache). Use `Array.from(palavra)` para contar/separar letras.

## Histórico
- PR #4: issues #1 (SW duplicado), #2 (CSP) e #3 (node_modules commitado)
- PR #5: deploy automático
- PR #6: tabuleiro colapsado (células sem tamanho)
- PR #7: layout cortado no iPhone + botão "?" invisível
- PR #8: POOL mostrava só 6 letras; palavras impossíveis; ordem alfabética; remoção de palavras em inglês
- PR #10: toque duplo (parcial), palavra + linha juntas, aviso de nova versão
- PR #11: toque duplo (de vez: só pointerdown) e domínio letris.kingdomapps.net
- PR #24: multilíngue — escolha de idioma e recordes por idioma (sprint 2), banco por idioma (sprint 3) e inglês (sprint 4); idioma e versão em todos os eventos do Analytics
- PR #23: textos da interface em `locales/pt.json` com `t()` (início do multilíngue)
- PR #22: testes de regressão automáticos (Playwright) e workflow de testes nos PRs
- PR #21: tabuleiro ficava por cima da lista de palavras no iPhone
- PR #20: só valem palavras da lista (caça-palavras), comemoração de fim de nível com anúncio, link da Vitrine
- PR #19: Google Analytics 4 com consentimento (LGPD), eventos do jogo e política de privacidade
- PR #18: favicon e ícone do iOS com o ícone oficial; remove os placeholders
- PR #17: banco de palavras sorteado por nível com palavras maiores, nova pontuação e velocidade mais gradual
- PR #16: pausa acelerava o jogo; girar sem parar segurava a peça no ar
- PR #15: anúncio próprio não clicava (iframe vazio do AdSense por cima)
- PR #14: anúncio próprio (Vitrine/WhatsApp) quando o AdSense não preenche o banner
- PR #13: ativa AdSense (client, bloco do banner, CSP e ads.txt)
- PR #12: layout novo (entrada, jogo, pausa, ajuda, fim de nível/jogo), modos Botões/Gestos, recordes e estrutura de anúncios

## Pendências / ideias
- AdSense ativo (`ca-pub-2445285097738073`, bloco 300×250 `1660743556`). Anúncios entre rodadas dependem da aprovação do H5 Games Ads (pedida à parte); até lá o `adBreak` não mostra nada e o jogo segue.
