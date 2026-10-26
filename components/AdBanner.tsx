import { useEffect, useRef, useState } from 'react';
import { ADS, HOUSE_AD, adsEnabled } from '../config/ads';
import { fillBanner } from '../lib/ads';

// Banner 300×250 das telas de fim de rodada.
// Se o AdSense preencher o bloco, mostra o anúncio dele; se não preencher
// (conta em revisão, sem anúncio, bloqueador, offline), mostra o anúncio
// próprio (HOUSE_AD). Sem nenhum dos dois, o espaço reservado ou nada.
//
// O <ins> do AdSense fica sempre montado (invisível e sem receber toques
// enquanto não preenche) porque o AdSense não preenche blocos sem tamanho;
// o anúncio próprio fica por cima dele (z-10). Ele marca o resultado
// em data-ad-status: "filled" ou "unfilled".

type Status = 'pending' | 'filled' | 'unfilled';

export function AdBanner() {
  const filled = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const live = adsEnabled && ADS.bannerSlot !== '';
  const [status, setStatus] = useState<Status>(live ? 'pending' : 'unfilled');

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
    // Script bloqueado ou lento: desiste e mostra o anúncio próprio
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

  const showHouse = status !== 'filled' && HOUSE_AD !== null;
  if (!live && !HOUSE_AD && !ADS.showPlaceholder) return null;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[10px] font-extrabold tracking-wider text-faint">PUBLICIDADE</span>
      <div className="relative w-[300px] h-[250px] rounded-lg overflow-hidden">
        {showHouse && HOUSE_AD ? (
          <a
            href={HOUSE_AD.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 block"
          >
            <img
              src={`${import.meta.env.BASE_URL}${HOUSE_AD.image}`}
              alt={HOUSE_AD.alt}
              width={300}
              height={250}
              className="block w-full h-full"
            />
          </a>
        ) : status !== 'filled' && (
          <div className="w-full h-full border-2 border-dashed border-line bg-deep/60 rounded-lg flex flex-col items-center justify-center gap-1 text-faint">
            <span className="text-[15px] font-extrabold">Espaço do anúncio</span>
            <span className="text-xs font-semibold">300 × 250</span>
          </div>
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
              // cima e engole o toque no anúncio próprio.
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
