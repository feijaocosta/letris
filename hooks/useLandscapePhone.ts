import { useEffect, useState } from 'react';

// Celular (tela de toque e pouca altura) deitado. O LETRIS é jogado em pé:
// o manifest trava a orientação no app instalado (Android), mas o iPhone e o
// navegador não deixam travar, então o app avisa e pausa (ver RotateNotice).
// Computador e tablet grandes não entram (altura maior que 600 px).
const QUERY = '(orientation: landscape) and (pointer: coarse) and (max-height: 600px)';

export function useLandscapePhone(): boolean {
  const [landscape, setLandscape] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;
    const update = () => setLandscape(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return landscape;
}
