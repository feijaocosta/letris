# LETRIS

Jogo que mistura Tetris com caça-palavras: as peças caem com letras e você encaixa os blocos para formar as palavras da lista do nível. Joga-se em **português, inglês, espanhol e francês**.

Jogue em **https://letris.kingdomapps.net** (funciona no navegador e pode ser instalado como app no celular).

## Como jogar

- **Forme palavras:** só valem as palavras da lista do nível, na horizontal ou na vertical. As maiores valem mais.
- **Complete linhas:** linha cheia some como no Tetris e dá pontos extras. Palavra e linha juntas contam as duas.
- **Bata a meta:** encontre as palavras pedidas para passar de nível. Cada nível traz letras e palavras novas.
- **Controles:** modo **Botões** (← ↓ →, girar e soltar) ou modo **Gestos** (deslizar move, tocar gira, arrastar ↓ acelera). No teclado: setas, espaço para soltar e P para pausar.
- **Idioma:** pela pílula no canto da tela de entrada ou com `?lang=pt`, `?lang=en`, `?lang=es` ou `?lang=fr` no endereço. Cada idioma tem o seu recorde.

## Rodar localmente

Precisa de Node.js 20 ou mais novo.

```bash
npm ci
npm run dev                                # desenvolvimento em http://localhost:5173
npm run build && npx vite preview --host   # build de produção (com PWA e CSP)
```

## Testes

```bash
npx playwright install chromium webkit   # só na primeira vez
npm run typecheck                        # tipos do TypeScript
npm test                                 # regras do jogo + o jogo no Chromium
npm run test:safari                      # o jogo no WebKit (motor do Safari)
```

Cada teste guarda um problema que já foi corrigido, para ele não voltar. Os testes também rodam em todo pull request (`.github/workflows/testes.yml`). Mais detalhes em [`tests/README.md`](tests/README.md).

## Idiomas

| O que | Onde |
|---|---|
| Idiomas do jogo (alfabeto, vogais, ordem do seletor) | `config/languages.json` |
| Textos da tela | `locales/<idioma>.json` (chaves em inglês; o português é a referência) |
| Palavras e progressão dos níveis | `data/words/<idioma>.json` |
| Política de privacidade | `public/privacidade.html`, `privacy.html`, `privacidad.html`, `confidentialite.html` |

O `npm run build` valida tudo isso: palavras em maiúsculas e sem acento (o Ñ do espanhol é letra própria), ordem alfabética do idioma, níveis com palavras suficientes, textos com as mesmas chaves em todos os idiomas e uma política de privacidade por idioma.

## Tecnologia

React 18, TypeScript, Vite 5, Tailwind CSS 4 e vite-plugin-pwa (funciona offline). Publicado no GitHub Pages a cada push na `main` (`.github/workflows/deploy.yml`).

As regras de trabalho e as decisões do projeto estão em [`CLAUDE.md`](CLAUDE.md).

---

Um jogo da [Kingdom Apps](https://kingdomapps.net).
