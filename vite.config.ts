import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Content-Security-Policy aplicada só no build de produção: em `vite dev`
// o Vite injeta scripts inline (HMR/React Refresh) que ela bloquearia.
// Obs.: frame-ancestors, X-Frame-Options, X-Content-Type-Options e
// Permissions-Policy só funcionam como headers HTTP (não via <meta>),
// e o GitHub Pages não permite headers customizados.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // React usa atributos style inline
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    securityMetaTags(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // registro único, via script externo gerado pelo plugin
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,webmanifest}']
      },
      manifest: {
        name: 'Letris - O Jogo de Palavras',
        short_name: 'Letris',
        description: 'Um jogo divertido que combina Tetris com formação de palavras em português.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/letris/',
        scope: '/letris/',
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
      base: '/letris/' // Definir o base para o PWA também
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  base: '/letris/', // Seu nome de repositório para GitHub Pages
})