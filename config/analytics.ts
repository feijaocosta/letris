// Google Analytics 4. Com `measurementId` vazio nada é carregado.
// Só começa a medir depois que o jogador aceita (ver lib/consent.ts).
// Com o ID preenchido, o build libera os domínios do GA na CSP (vite.config.ts).

export const ANALYTICS = {
  measurementId: 'G-1YMLTC0J79',
};

export const analyticsEnabled = ANALYTICS.measurementId.trim() !== '';
