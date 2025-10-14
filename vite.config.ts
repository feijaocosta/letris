import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
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