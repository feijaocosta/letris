// Aviso de cookies (LGPD). Aparece na tela de entrada até o jogador
// escolher; dá para reabrir pelo link "Privacidade" na entrada.

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentBanner({ onAccept, onDecline }: ConsentBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 safe-area pointer-events-none">
      <div className="p-3">
      <div
        className="pointer-events-auto mx-auto max-w-md bg-ink border border-line rounded-3xl p-4 flex flex-col gap-3 text-white shadow-2xl"
        role="dialog"
        aria-label="Privacidade e cookies"
      >
        <p className="m-0 text-sm font-semibold text-chip leading-snug">
          Usamos cookies para medir como o jogo é usado e para personalizar os anúncios.
          Seus recordes ficam só no seu aparelho.{' '}
          <a href={`${import.meta.env.BASE_URL}privacidade.html`} className="text-tile-yellow font-extrabold underline">
            Política de privacidade
          </a>
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onDecline} className="h-12 rounded-2xl bg-panel text-white font-extrabold">
            Recusar
          </button>
          <button type="button" onClick={onAccept} className="btn-3d h-12 rounded-2xl bg-tile-green text-white font-black">
            Aceitar
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
