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
//  3. `testMode: true` mostra anúncios de teste entre rodadas; use só para
//     validar localmente (em produção deixe false).
//
// Com `client` preenchido, o build também libera os domínios do Google na
// CSP (vite.config.ts) e publica /ads.txt.

export const ADS = {
  client: 'ca-pub-2445285097738073',
  bannerSlot: '1660743556', // bloco "letris-display" (300×250)
  /** data-adbreak-test="on": anúncios de teste da Ad Placement API.
   *  Ligar só para testar localmente: em produção os jogadores veriam
   *  anúncios de teste. Os banners não são afetados. */
  testMode: false,
  /** Intervalo mínimo sugerido entre anúncios de tela cheia */
  frequencyHint: '60s',
  /** Mostra a moldura "Espaço do anúncio" enquanto não há bloco configurado */
  showPlaceholder: true,
};

export const adsEnabled = ADS.client.trim() !== '';
