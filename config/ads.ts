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
  /** Mostra a moldura "Espaço do anúncio" quando nem o AdSense nem o Kerux
   *  têm anúncio */
  showPlaceholder: true,
  /** Quanto esperar o AdSense preencher o banner antes de chamar o Kerux */
  bannerTimeoutMs: 4000,
};

/**
 * Kerux Ads (servidor de anúncios próprio da Kingdom Apps).
 * - `modo: 'principal'`: o Kerux entrega direto, sem esperar o Google (uso
 *   atual, enquanto o Google não libera os anúncios).
 * - `modo: 'fallback'`: o Google tenta primeiro; o Kerux entra quando o
 *   AdSense não preenche o banner ou o intervalo entre rodadas não mostra nada.
 * Posições: `banner` (300×250; a Vitrine é a peça da casa) e `telaCheia`
 * (entre rodadas, com botão fechar). Campanhas, artes e o intervalo mínimo
 * de cada posição são cadastrados no Kerux, sem deploy do jogo.
 * Guia: https://github.com/feijaocosta/kerux-ads/blob/main/docs/integracao.md
 * Para desligar, use `null`.
 */
export const KERUX: {
  sdk: string;
  site: string;
  /** Chave pública do site no Kerux (não é segredo) */
  chave: string;
  /** 'principal' = sem Google; 'fallback' = Kerux só quando o Google não tem anúncio */
  modo: 'principal' | 'fallback';
  posicoes: { banner: string; telaCheia: string };
  /** Segundos até o botão fechar aparecer na tela cheia */
  fecharApos: number;
} | null = {
  sdk: 'https://kerux.kingdomapps.net/sdk.js',
  site: 'letris',
  chave: 'pk_39e755b230905f7f424339b8',
  modo: 'principal',
  posicoes: { banner: 'fim-de-fase', telaCheia: 'entre-fases' },
  fecharApos: 5,
};

/** Domínios do Kerux liberados na CSP (vite.config.ts) */
export const KERUX_HOSTS = KERUX ? ['https://kerux.kingdomapps.net', 'https://kerux-cdn.kingdomapps.net'] : [];

export const adsEnabled = ADS.client.trim() !== '';
