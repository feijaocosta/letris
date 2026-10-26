import { ADS, adsEnabled } from '../config/ads';

// Integração com a Ad Placement API do AdSense (anúncios para jogos HTML5)
// e com os banners display. Os dois usam o mesmo script adsbygoogle.js.
// Docs: https://developers.google.com/ad-placement

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let initialized = false;

function push(config: unknown) {
  (window.adsbygoogle = window.adsbygoogle || []).push(config);
}

/** Carrega o script do AdSense uma vez. Sem `client` configurado, não faz nada. */
export function initAds() {
  if (!adsEnabled || initialized) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`;
  script.dataset.adFrequencyHint = ADS.frequencyHint;
  if (ADS.testMode) script.dataset.adbreakTest = 'on';
  document.head.appendChild(script);

  // adConfig: pré-carrega os anúncios entre rodadas; o jogo não tem som
  push({ preloadAdBreaks: 'on', sound: 'off' });
}

/**
 * Pede um anúncio de tela cheia entre rodadas (adBreak type 'next') e
 * resolve quando o jogo pode seguir. O Google decide se mostra ou não
 * (frequência, disponibilidade). Se o script não carregar (bloqueador,
 * offline) ou não houver anúncio, resolve logo.
 */
export function adBreakNext(name: string): Promise<void> {
  if (!adsEnabled) return Promise.resolve();

  return new Promise(resolve => {
    let finished = false;
    let started = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    try {
      push({
        type: 'next',
        name,
        beforeAd: () => { started = true; },
        afterAd: () => {},
        adBreakDone: finish,
      });
    } catch {
      finish();
    }

    // Se nada começou em 3 s (script bloqueado/ausente), não trava o jogo
    setTimeout(() => { if (!started) finish(); }, 3000);
  });
}

/** Preenche um <ins class="adsbygoogle"> recém-montado. */
export function fillBanner() {
  try {
    push({});
  } catch {
    // bloqueador ou script indisponível: o espaço fica vazio
  }
}
