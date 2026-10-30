import { useEffect, useRef, useState } from 'react';
import { ADS, KERUX, adsEnabled } from '../config/ads';
import { fillBanner } from '../lib/ads';
import { keruxBanner, keruxModo } from '../lib/kerux';
import { useI18n } from '../lib/i18n';

// Banner 300×250 das telas de fim de rodada.
// Kerux principal (config/ads.ts): pede direto ao Kerux Ads, sem AdSense.
// Kerux fallback:
// 1. Se o AdSense preencher o bloco, mostra o anúncio dele.
// 2. Se não preencher (conta em revisão, sem anúncio, bloqueador, offline),
//    chama o Kerux Ads (campanhas próprias; a Vitrine é a peça da casa).
// Sem nenhum dos dois, o espaço reservado (ou nada).
//
// O <ins> do AdSense fica sempre montado (invisível e sem receber toques
// enquanto não preenche) porque o AdSense não preenche blocos sem tamanho;
// o Kerux fica por cima dele (z-10). O AdSense marca o resultado em
// data-ad-status: "filled" ou "unfilled".

type Status = 'pending' | 'filled' | 'unfilled';
type Kerux = 'idle' | 'loading' | 'shown' | 'none';

export function AdBanner() {
  const filled = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const keruxRef = useRef<HTMLDivElement>(null);
  const live = adsEnabled && ADS.bannerSlot !== '' && keruxModo() !== 'principal';
  const [status, setStatus] = useState<Status>(live ? 'pending' : 'unfilled');
  const [kerux, setKerux] = useState<Kerux>(KERUX ? 'idle' : 'none');
  const { t, lang } = useI18n();

  useEffect(() => {
    if (!live) return;
    const ins = insRef.current;
    if (!ins) return;

    const check = () => {
      const adStatus = ins.getAttribute('data-ad-status');
      if (adStatus === 'filled') setStatus('filled');
      else if (adStatus === 'unfilled') setStatus('unfilled');
    };
    const observer = new MutationObserver(check);
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    // Script bloqueado ou lento: desiste e chama o Kerux
    const timeout = setTimeout(() => setStatus(s => (s === 'pending' ? 'unfilled' : s)), ADS.bannerTimeoutMs);

    // ref evita pedir o mesmo anúncio duas vezes (StrictMode monta duas vezes)
    if (!filled.current) {
      filled.current = true;
      fillBanner();
    }
    check();

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [live]);

  // AdSense sem anúncio: pede uma vez ao Kerux
  useEffect(() => {
    if (status !== 'unfilled' || kerux !== 'idle' || !keruxRef.current) return;
    setKerux('loading');
    keruxBanner(keruxRef.current, lang).then(shown => setKerux(shown ? 'shown' : 'none'));
  }, [status, kerux, lang]);

  const empty = status !== 'filled' && kerux !== 'shown';
  if (!live && !KERUX && !ADS.showPlaceholder) return null;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[10px] font-extrabold tracking-wider text-faint">{t('ads.label')}</span>
      <div className="relative w-[300px] h-[250px] rounded-lg overflow-hidden">
        {empty && ADS.showPlaceholder && (
          <div className="w-full h-full border-2 border-dashed border-line bg-deep/60 rounded-lg flex flex-col items-center justify-center gap-1 text-faint">
            <span className="text-[15px] font-extrabold">{t('ads.placeholder')}</span>
            <span className="text-xs font-semibold">300 × 250</span>
          </div>
        )}

        {KERUX && status !== 'filled' && (
          <div
            ref={keruxRef}
            data-testid="kerux-banner"
            className="absolute inset-0 z-10"
            style={{ pointerEvents: kerux === 'shown' ? 'auto' : 'none' }}
          />
        )}

        {live && (
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{
              display: 'inline-block',
              width: 300,
              height: 250,
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              visibility: status === 'filled' ? 'visible' : 'hidden',
              // O AdSense põe "visibility: visible" no iframe dentro do <ins>,
              // então só esconder não basta: sem isto o iframe vazio fica por
              // cima e engole o toque no anúncio do Kerux.
              pointerEvents: status === 'filled' ? 'auto' : 'none',
            }}
            data-ad-client={ADS.client}
            data-ad-slot={ADS.bannerSlot}
          />
        )}
      </div>
    </div>
  );
}
