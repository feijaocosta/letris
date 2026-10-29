# Testes de regressão

Cada teste guarda um problema que já foi corrigido (o nome cita o PR), para ele não voltar.

| Pasta | O que testa | Navegador |
|---|---|---|
| `tests/logica/` | Regras: palavras, sorteio, pontuação, velocidade | não usa |
| `tests/e2e/` | O jogo de verdade: controles, palavras, fim de nível, pausa, layout, anúncio, cookies, atualização | Chromium (e WebKit/Safari) |

## Rodar

```bash
npm ci
npx playwright install chromium webkit   # só na primeira vez (baixa os navegadores)
npm test                                 # lógica + jogo no Chromium
npm run test:safari                      # o jogo no WebKit, o motor do Safari do iPhone
npm run test:ui                          # abre a interface do Playwright para ver os testes rodando
```

O `npm test` faz sozinho um build de teste (`npm run build:e2e`, pasta `dist-e2e/`) e sobe ele em http://localhost:4180. Na tela, os testes ficam iguais ao build publicado, mas com ganchos (`window.__letris`) para montar o tabuleiro, trocar a peça e ler o placar. Os ganchos só existem com `LETRIS_E2E=1` e somem do build normal.

Nos testes do jogo:
- tudo que sai do localhost (AdSense, Analytics) é bloqueado;
- erro de JavaScript ou violação da CSP faz o teste falhar;
- o aviso de cookies já vem respondido com "Recusar" (dá para mudar com `test.use({ consent: null })`).

## Ao corrigir um bug

Escreva primeiro o teste que mostra o problema (ele tem que falhar), corrija e veja o teste passar. Coloque o número do PR no nome do teste.

## No GitHub

`.github/workflows/testes.yml` roda `npm run build` e `npm test` em todo PR para a `main`. PR vermelho não deve ser mesclado.
