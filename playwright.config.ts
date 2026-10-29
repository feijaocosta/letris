import { defineConfig, devices } from '@playwright/test';

// Testes de regressão do LETRIS (ver tests/README.md).
// - logica: regras do jogo (palavras, pontuação, velocidade), sem navegador
// - chromium: o jogo de verdade, no build de produção com os ganchos de teste
// - safari: os mesmos testes no WebKit (motor do Safari do iPhone)
const PORT = 4180;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run build:e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'logica', testDir: 'tests/logica' },
    {
      name: 'chromium',
      testDir: 'tests/e2e',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'safari',
      testDir: 'tests/e2e',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
  ],
});
