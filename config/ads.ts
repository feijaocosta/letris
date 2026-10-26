// Configuração dos anúncios (Google AdSense).
//
// Enquanto `client` estiver vazio, nenhum script do Google é carregado:
// os intervalos entre rodadas seguem direto e os banners mostram só o
// espaço reservado (se `showPlaceholder` for true).
//
// Para ativar:
//  1. `client`: o ID do editor, no formato 'ca-pub-0000000000000000'.
//  2. `bannerSlot`: o ID do bloco de anúncio display (300×250) criado no
//     AdSense. Sem ele, só os anúncios entre rodadas (Ad Placement API)
//     funcionam.
//  3. Deixe `testMode: true` até validar; depois mude para false.
//
// Com `client` preenchido, o build também libera os domínios do Google na
// CSP (vite.config.ts) e publica /ads.txt.

export const ADS = {
  client: '',
  bannerSlot: '',
  /** data-adbreak-test="on": anúncios de teste da Ad Placement API */
  testMode: true,
  /** Intervalo mínimo sugerido entre anúncios de tela cheia */
  frequencyHint: '60s',
  /** Mostra a moldura "Espaço do anúncio" enquanto não há bloco configurado */
  showPlaceholder: true,
};

export const adsEnabled = ADS.client.trim() !== '';
