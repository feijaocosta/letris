import { ControlModeToggle, IconPlay, Label, LanguagePicker, Logo, StatCard, Tile, type ControlMode, type TileColor } from './LetrisUI';
import { load, recordKey } from '../lib/storage';
import { LANGUAGES, useI18n, type Lang } from '../lib/i18n';
import { track } from '../lib/analytics';

// Letras soltas de enfeite: [letra, cor, tamanho, esquerda %, topo %, rotação]
const DECOR: Array<[string, TileColor, number, number, number, number]> = [
  ['A', 'blue', 34, 6, 6, -12], ['E', 'red', 24, 46, 4, 6], ['O', 'orange', 28, 78, 9, 10],
  ['S', 'green', 38, 30, 14, -8], ['L', 'yellow', 30, 10, 30, 14], ['U', 'blue', 26, 66, 40, -16],
  ['R', 'green', 22, 22, 42, 20], ['N', 'orange', 30, 86, 52, -6], ['T', 'yellow', 34, -2, 54, 8],
];

interface HomeScreenProps {
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  onPlay: () => void;
  onHelp: () => void;
  onPrivacy: () => void;
  isOnline: boolean;
}

export function HomeScreen({ controlMode, onControlModeChange, onPlay, onHelp, onPrivacy, isOnline }: HomeScreenProps) {
  const { t, n, lang, setLang } = useI18n();
  const bestScore = load(recordKey('bestScore', lang), 0);
  const bestLevel = load(recordKey('bestLevel', lang), 1);

  const changeLanguage = (next: Lang) => {
    if (next === lang) return;
    track('language_change', { from: lang, to: next });
    setLang(next);
  };

  return (
    <div className="h-full w-full bg-ink text-white safe-area overflow-hidden">
      <div className="relative h-full w-full max-w-md mx-auto px-6 pt-2 pb-4 flex flex-col">
        <div className="absolute inset-x-0 top-0 h-3/5 pointer-events-none" aria-hidden="true">
          {DECOR.map(([letter, color, size, left, top, rotate]) => (
            <Tile key={letter} letter={letter} color={color} size={size}
              style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: `rotate(${rotate}deg)`, opacity: 0.22 }} />
          ))}
        </div>

        <div className="relative flex-1 min-h-[100px] flex flex-col items-center justify-center gap-3.5">
          <Logo size={48} gap={6} />
          <p className="m-0 text-[17px] font-bold text-soft text-center">{t('home.tagline')}</p>
          {!isOnline && (
            <span className="px-3 py-1 rounded-full bg-panel text-xs font-extrabold text-soft">{t('home.offline')}</span>
          )}
        </div>

        <div className="relative flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label={t('home.bestScore')} value={n(bestScore)} />
            <StatCard label={t('home.bestLevel')} value={bestLevel} />
          </div>

          {LANGUAGES.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-center">{t('home.language')}</Label>
              <LanguagePicker value={lang} options={LANGUAGES} onChange={changeLanguage} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-center">{t('home.controls')}</Label>
            <ControlModeToggle value={controlMode} onChange={onControlModeChange} compact />
          </div>

          <button
            type="button"
            onClick={onPlay}
            className="btn-3d h-[68px] rounded-[20px] bg-tile-green text-white text-2xl font-black tracking-wide flex items-center justify-center gap-2.5"
          >
            <IconPlay size={26} />
            {t('home.play')}
          </button>
          <button type="button" onClick={onHelp} className="h-[52px] rounded-2xl bg-panel text-white text-base font-extrabold">
            {t('common.howToPlay')}
          </button>
          <div className="flex justify-center items-center gap-2 text-xs font-semibold text-faint">
            <span>{t('home.version', { version: __APP_VERSION__ })}</span>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onPrivacy} className="min-h-0 min-w-0 py-1 underline font-extrabold text-soft">
              {t('home.privacy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
