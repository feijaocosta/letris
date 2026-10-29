import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { ADS, adsEnabled } from './config/ads'
import { analyticsEnabled } from './config/analytics'

// Content-Security-Policy aplicada só no build de produção: em `vite dev`
// o Vite injeta scripts inline (HMR/React Refresh) que ela bloquearia.
// Obs.: frame-ancestors, X-Frame-Options, X-Content-Type-Options e
// Permissions-Policy só funcionam como headers HTTP (não via <meta>),
// e o GitHub Pages não permite headers customizados.
// Com AdSense configurado (config/ads.ts), libera os domínios do Google:
// script do adsbygoogle, iframes dos anúncios e imagens/requests deles.
const AD_HOSTS = adsEnabled
  ? ' https://*.googlesyndication.com https://*.googleadservices.com https://*.googletagservices.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google'
  : ''

// Com o GA4 configurado (config/analytics.ts), libera o gtag.js e os envios.
const GA_HOSTS = analyticsEnabled
  ? ' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com'
  : ''

const CSP = [
  "default-src 'self'",
  `script-src 'self'${AD_HOSTS}${GA_HOSTS}`,
  "style-src 'self' 'unsafe-inline'", // React usa atributos style inline
  `img-src 'self' data: blob:${adsEnabled || analyticsEnabled ? ' https:' : ''}`,
  "font-src 'self' data:",
  `connect-src 'self'${AD_HOSTS}${GA_HOSTS}`,
  `frame-src${adsEnabled ? AD_HOSTS : " 'none'"}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityMetaTags = (): Plugin => ({
  name: 'letris-security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
})

// Versão do build: data/hora + commit (no GitHub Actions). Vai embutida no
// bundle (__APP_VERSION__) e também em dist/version.json, que fica FORA do
// precache do Service Worker. O app compara as duas para saber se há versão
// nova publicada (ver hooks/useAppUpdate.ts).
const APP_VERSION = [
  new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  process.env.GITHUB_SHA?.slice(0, 7),
].filter(Boolean).join('-')

const versionFile = (): Plugin => ({
  name: 'letris-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ version: APP_VERSION }),
    })
  },
})

// ads.txt na raiz do domínio, exigido pelo AdSense (só com client configurado)
const adsTxt = (): Plugin => ({
  name: 'letris-ads-txt',
  apply: 'build',
  generateBundle() {
    if (!adsEnabled) return
    this.emitFile({
      type: 'asset',
      fileName: 'ads.txt',
      source: `google.com, ${ADS.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`,
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    securityMetaTags(),
    versionFile(),
    adsTxt(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // registro único, via script externo gerado pelo plugin
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,webmanifest,woff2}'],
        // version.json precisa vir sempre da rede
        globIgnores: ['**/version.json', '**/ads.txt'],
        navigateFallbackDenylist: [/version\.json/, /ads\.txt/],
      },
      manifest: {
        name: 'Letris - O Jogo de Palavras',
        short_name: 'Letris',
        description: 'Um jogo divertido que combina Tetris com formação de palavras em português.',
        theme_color: '#2a1f38',
        background_color: '#2a1f38',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // Adicionar esta configuração para garantir que o service worker seja gerado com o caminho base correto
      devOptions: {
        enabled: true // Habilitar para testar em desenvolvimento, desabilitar em produção se não for necessário
      },
      base: '/' // mesmo base do Vite
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    // Ganchos dos testes automáticos (ver tests/); false no build publicado
    __E2E__: JSON.stringify(process.env.LETRIS_E2E === '1'),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Servido na raiz do domínio próprio letris.kingdomapps.net (o endereço
  // antigo feijaocosta.github.io/letris/ é redirecionado pelo GitHub Pages).
  base: '/',
})