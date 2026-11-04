import { useI18n } from '../lib/i18n';
import { Logo } from './LetrisUI';

// Aviso quando o celular está deitado: o jogo é em pé (ver useLandscapePhone)
export function RotateNotice() {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[70] bg-ink text-white safe-area flex flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <Logo size={26} gap={3} />
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-tile-yellow">
        <rect x="20" y="6" width="24" height="42" rx="5" />
        <path d="M29 41h6" />
        <path d="M50 56a22 22 0 0 0 8-17" />
        <path d="M58 33v6h-6" />
      </svg>
      <h1 className="m-0 text-2xl font-black">{t('rotate.title')}</h1>
      <p className="m-0 text-[15px] font-bold text-soft">{t('rotate.text')}</p>
    </div>
  );
}
