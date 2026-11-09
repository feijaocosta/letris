import type { ReactNode } from 'react';
import { IconDown, IconHand, LanguagePicker, Logo, Tile, type TileColor } from './LetrisUI';
import { LANGUAGES, useI18n, type Lang } from '../lib/i18n';
import { track } from '../lib/analytics';
import type { GameMode } from '../lib/storage';

// Primeira tela: escolha do jogo (Clássico ou Encaixe), com uma ilustração de
// cada um feita com os blocos do LETRIS. Partida pela metade ganha o selo
// "Em andamento"; o Continuar fica na tela do jogo (HomeScreen).

type MiniCell = TileColor | null;

/** Tabuleirinho de blocos (sem letras) para as ilustrações */
function MiniBoard({ cells, size = 19 }: { cells: MiniCell[][]; size?: number }) {
  return (
    <div className="grid gap-[3px] bg-deep rounded-xl p-1.5" style={{ gridTemplateColumns: `repeat(${cells[0].length}, ${size}px)` }}>
      {cells.flatMap((row, r) => row.map((c, i) => c
        ? <Tile key={`${r}-${i}`} color={c} size={size} />
        : <div key={`${r}-${i}`} className="rounded-[3px] bg-white/5" style={{ width: size, height: size }} />))}
    </div>
  );
}

const _ = null;
const B: TileColor = 'blue', Y: TileColor = 'yellow', R: TileColor = 'red', O: TileColor = 'orange', G: TileColor = 'green';

/** Clássico: peça caindo (T vermelho) em cima de um tabuleiro empilhado */
function ClassicArt() {
  return (
    <div className="relative">
      <MiniBoard cells={[
        [_, R, R, R, _],
        [_, _, R, _, _],
        [_, _, _, _, _],
        [_, _, _, _, _],
        [B, _, _, G, G],
        [B, Y, _, G, O],
      ]} />
      <span className="absolute -right-6 top-9 text-tile-yellow animate-[tutorial-drag_1.2s_ease-in-out_infinite]">
        <IconDown size={26} strokeWidth={3.5} />
      </span>
    </div>
  );
}

/** Encaixe: peça sendo arrastada da bandeja para dentro do tabuleiro */
function EncaixeArt() {
  return (
    <div className="relative">
      <MiniBoard cells={[
        [B, B, _, _, Y],
        [B, _, _, _, Y],
        [_, _, _, _, _],
        [G, _, _, R, R],
        [G, G, _, R, O],
      ]} />
      <div className="absolute left-[32px] top-[46px] flex gap-[3px] drop-shadow-lg animate-[tutorial-swipe_1.4s_ease-in-out_infinite]">
        <Tile color="orange" size={19} />
        <Tile color="orange" size={19} />
      </div>
      <span className="absolute -right-3 -bottom-4 text-tile-yellow">
        <IconHand size={28} />
      </span>
    </div>
  );
}

function ModeCard({ id, art, title, text, badge, onClick }: {
  id: string;
  art: ReactNode;
  title: string;
  text: string;
  badge: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={id}
      onClick={onClick}
      className="btn-3d relative w-full h-full rounded-3xl bg-panel px-3 pt-5 pb-4 flex flex-col items-center gap-3 text-center"
    >
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-tile-yellow text-ink text-[11px] font-black">{badge}</span>
      )}
      {/* Altura fixa: os títulos dos dois cartões ficam alinhados */}
      <span className="h-[150px] [@media(max-height:620px)]:h-[108px] flex items-center justify-center [@media(max-height:620px)]:scale-75">{art}</span>
      <span className="text-[22px] font-black leading-tight text-white">{title}</span>
      <span className="text-[13px] font-bold leading-snug text-soft">{text}</span>
    </button>
  );
}

interface GameChooserProps {
  onChoose: (mode: GameMode) => void;
  /** Modos com partida pela metade (selo "Em andamento") */
  inProgress: Record<GameMode, boolean>;
  onPrivacy: () => void;
  isOnline: boolean;
}

export function GameChooser({ onChoose, inProgress, onPrivacy, isOnline }: GameChooserProps) {
  const { t, lang, setLang } = useI18n();

  const changeLanguage = (next: Lang) => {
    if (next === lang) return;
    track('language_change', { from: lang, to: next });
    setLang(next);
  };

  return (
    <div className="h-full w-full bg-ink text-white safe-area overflow-hidden">
      <div className="relative h-full w-full max-w-md mx-auto px-5 pt-2 pb-4 flex flex-col gap-3">
        {LANGUAGES.length > 1 && (
          <div className="flex justify-end shrink-0 -mr-1">
            <LanguagePicker value={lang} options={LANGUAGES} onChange={changeLanguage} />
          </div>
        )}

        {/* Logo e cartões centralizados na altura disponível */}
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-6 [@media(max-height:620px)]:gap-3">
        <div className="flex flex-col items-center justify-center gap-3">
          <Logo size={44} gap={5} />
          <p className="m-0 text-[16px] font-bold text-soft text-center [@media(max-height:620px)]:hidden">{t('home.tagline')}</p>
          {!isOnline && (
            <span className="px-3 py-1 rounded-full bg-panel text-xs font-extrabold text-soft">{t('home.offline')}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3" role="group" aria-label={t('modes.label')}>
          <ModeCard
            id="mode-classic"
            art={<ClassicArt />}
            title={t('modes.classic')}
            text={t('modes.classicText')}
            badge={inProgress.classic ? t('modes.inProgress') : null}
            onClick={() => onChoose('classic')}
          />
          <ModeCard
            id="mode-encaixe"
            art={<EncaixeArt />}
            title={t('modes.encaixe')}
            text={t('modes.encaixeText')}
            badge={inProgress.encaixe ? t('modes.inProgress') : null}
            onClick={() => onChoose('encaixe')}
          />
        </div>
        </div>

        <div className="flex justify-center items-center gap-2 text-xs font-semibold text-faint pt-1">
          <span>{t('home.version', { version: __APP_VERSION__ })}</span>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={onPrivacy} className="min-h-0 min-w-0 py-1 underline font-extrabold text-soft">
            {t('home.privacy')}
          </button>
        </div>
      </div>
    </div>
  );
}
