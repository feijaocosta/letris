import { useEffect, useRef } from 'react';
import { ADS, adsEnabled } from '../config/ads';
import { fillBanner } from '../lib/ads';

// Banner 300×250 das telas de fim de rodada. Com AdSense configurado,
// renderiza o bloco real; sem, mostra o espaço reservado (ou nada).
export function AdBanner() {
  const filled = useRef(false);
  const live = adsEnabled && ADS.bannerSlot !== '';

  useEffect(() => {
    // ref evita pedir o mesmo anúncio duas vezes (StrictMode monta duas vezes)
    if (live && !filled.current) {
      filled.current = true;
      fillBanner();
    }
  }, [live]);

  if (!live && !ADS.showPlaceholder) return null;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[10px] font-extrabold tracking-wider text-faint">PUBLICIDADE</span>
      {live ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: 300, height: 250 }}
          data-ad-client={ADS.client}
          data-ad-slot={ADS.bannerSlot}
        />
      ) : (
        <div className="w-[300px] h-[250px] rounded-lg border-2 border-dashed border-line bg-deep/60 flex flex-col items-center justify-center gap-1 text-faint">
          <span className="text-[15px] font-extrabold">Espaço do anúncio</span>
          <span className="text-xs font-semibold">300 × 250</span>
        </div>
      )}
    </div>
  );
}
