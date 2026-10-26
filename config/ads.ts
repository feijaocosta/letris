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
  /** Mostra a moldura "Espaço do anúncio" enquanto não há bloco configurado
   *  (só quando também não há anúncio próprio) */
  showPlaceholder: true,
  /** Quanto esperar o AdSense preencher o banner antes de mostrar o anúncio próprio */
  bannerTimeoutMs: 4000,
};

/**
 * Anúncio próprio ("da casa"): aparece no lugar do banner quando o AdSense
 * não preenche o espaço (conta em revisão, sem anúncio disponível,
 * bloqueador ou offline). Para desligar, use `null`.
 */
export const HOUSE_AD: { image: string; alt: string; href: string } | null = {
  image: 'ads/vitrine-kingdomapps.png', // em public/, relativo ao base do Vite
  alt: 'Vitrine Kingdom Apps: site pronto por assinatura para o seu negócio. Fale conosco no WhatsApp.',
  href: 'https://wa.me/5511947904394?text=' + encodeURIComponent('Olá! Vi o anúncio da Vitrine no Letris e quero saber mais.'),
};

export const adsEnabled = ADS.client.trim() !== '';
