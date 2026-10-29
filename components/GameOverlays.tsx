import type { CSSProperties, ReactNode } from 'react';
import { AdBanner } from './AdBanner';
import {
  ControlModeToggle, IconStar, Label, Logo, Panel, StatCard, Tile, TILE_COLORS, WordChip,
  type ControlMode,
} from './LetrisUI';
import { useI18n } from '../lib/i18n';

// Telas que aparecem por cima do jogo: pausa, fim de nível e fim de jogo.

function Screen({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return (
    <div className={`fixed inset-0 z-30 safe-area ${dim ? 'bg-[#17111f]/95' : 'bg-ink'}`}>
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-3d h-[60px] rounded-[18px] bg-tile-green text-white text-xl font-black disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-12 rounded-2xl bg-panel text-white text-[15px] font-extrabold">
      {children}
    </button>
  );
}

// ---------- Pausa ----------

interface PauseMenuProps {
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  onResume: () => void;
  onHelp: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export function PauseMenu({ controlMode, onControlModeChange, onResume, onHelp, onRestart, onHome }: PauseMenuProps) {
  const { t } = useI18n();
  return (
    <Screen dim>
      <div className="flex-1" />
      <div className="bg-ink border border-line rounded-3xl px-5 py-6 flex flex-col gap-5">
        <div className="flex justify-center"><Logo size={30} gap={4} /></div>
        <h2 className="m-0 text-center text-[26px] font-black">{t('pause.title')}</h2>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">{t('pause.howToPlayQuestion')}</Label>
          <ControlModeToggle value={controlMode} onChange={onControlModeChange} />
          <span className="text-[13px] font-semibold text-soft text-center">
            {t('pause.controlsHint')}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <PrimaryButton onClick={onResume}>{t('pause.resume')}</PrimaryButton>
          <div className="grid grid-cols-2 gap-2.5">
            <SecondaryButton onClick={onHelp}>{t('common.howToPlay')}</SecondaryButton>
            <SecondaryButton onClick={onRestart}>{t('pause.newGame')}</SecondaryButton>
          </div>
          <button type="button" onClick={onHome} className="h-11 text-soft text-[15px] font-extrabold">
            {t('pause.home')}
          </button>
        </div>
      </div>
      <div className="flex-1" />
    </Screen>
  );
}

// ---------- Comemoração (entre a última palavra e o resumo) ----------

export function LevelSplash({ level, words }: { level: number; words: string[] }) {
  const { t } = useI18n();
  const last = words[words.length - 1];
  return (
    <div className="fixed inset-0 z-30 bg-ink/85 safe-area flex items-center justify-center px-6 animate-[fade-in_.25s_ease-out]">
      <div className="max-w-sm flex flex-col items-center gap-4 text-center animate-[pop-in_.4s_ease-out_both]">
        <div className="flex gap-1 text-ink" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="tile w-11 h-11" style={{ ...starTile, transform: i === 1 ? 'translateY(-6px)' : undefined }}>
              <IconStar size={24} />
            </div>
          ))}
        </div>
        <div>
          <h1 className="m-0 text-[34px] font-black leading-tight">{t('levelSplash.title')}</h1>
          <span className="text-base font-bold text-soft">{t('levelSplash.subtitle', { level })}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {words.map((word, i) => (
            <span
              key={word}
              className={`rounded-full animate-[pop-in_.3s_ease-out_both] ${word === last ? 'ring-2 ring-tile-yellow' : ''}`}
              style={{ animationDelay: `${150 + i * 60}ms` }}
            >
              <WordChip word={word} found />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Nível concluído ----------

interface LevelCompleteProps {
  level: number;
  requiredWords: number;
  words: number;
  points: number;
  lines: number;
  levelBonus: number;
  nextLevel: number;
  nextPoolName: string;
  nextRequiredWords: number;
  newLetters: string[];
  onContinue: () => void;
}

export function LevelComplete(p: LevelCompleteProps) {
  const { t, n, rich } = useI18n();
  return (
    <Screen>
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <div className="flex gap-1 text-ink" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="tile w-10 h-10" style={{ ...starTile, transform: i === 1 ? 'translateY(-6px)' : undefined }}>
              <IconStar size={22} />
            </div>
          ))}
        </div>
        <h1 className="m-0 text-[28px] font-black text-center">{t('levelComplete.title', { level: p.level })}</h1>
        <span className="text-[15px] font-bold text-soft">{t('levelComplete.subtitle', { count: p.requiredWords })}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label={t('levelComplete.words')} value={p.words} />
        <StatCard label={t('levelComplete.points')} value={n(p.points)} />
        <StatCard label={t('levelComplete.lines')} value={p.lines} />
      </div>
      {p.levelBonus > 0 && (
        <span className="-mt-1.5 text-center text-[13px] font-bold text-soft">
          {rich('levelComplete.bonus', { bonus: <span className="text-tile-yellow font-black">+{n(p.levelBonus)}</span> })}
        </span>
      )}

      <Panel className="p-3 flex flex-col gap-2">
        <span className="text-[13px] font-extrabold text-soft">
          {t('levelComplete.nextLabel')}{' '}
          <span className="text-white font-black">{t('levelComplete.nextLevel', { level: p.nextLevel, pool: p.nextPoolName })}</span>
          {' · '}{t('levelComplete.nextGoal', { count: p.nextRequiredWords })}
        </span>
        {p.newLetters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-extrabold text-soft">{t('levelComplete.newLetters')}</span>
            {p.newLetters.map((letter, i) => (
              <Tile key={letter} letter={letter} color={TILE_COLORS[i % TILE_COLORS.length]} size={26} />
            ))}
          </div>
        )}
      </Panel>

      <AdBanner />

      <div className="flex-1" />
      <PrimaryButton onClick={p.onContinue}>{t('levelComplete.continue')}</PrimaryButton>
    </Screen>
  );
}

const starTile = { '--tile-bg': 'var(--color-tile-yellow)', '--tile-fg': 'var(--color-ink)' } as CSSProperties;

// ---------- Fim de jogo ----------

interface GameOverProps {
  score: number;
  level: number;
  words: string[];
  isNewRecord: boolean;
  busy: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export function GameOver({ score, level, words, isNewRecord, busy, onRestart, onHome }: GameOverProps) {
  const { t, n } = useI18n();
  return (
    <Screen>
      <div className="flex flex-col items-center gap-1 pt-2">
        <h1 className="m-0 text-[28px] font-black">{t('gameOver.title')}</h1>
        <span className="text-[15px] font-bold text-soft">{t('gameOver.subtitle', { level })}</span>
      </div>

      <Panel className="p-4 flex flex-col items-center gap-1">
        <Label className="text-xs">{t('gameOver.score')}</Label>
        <span className="text-[44px] font-black leading-none">{n(score)}</span>
        {isNewRecord && (
          <span className="mt-1 px-3 py-1 rounded-full bg-tile-yellow text-ink text-[13px] font-black">{t('gameOver.newRecord')}</span>
        )}
      </Panel>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">{t('gameOver.wordsFormed', { count: words.length })}</Label>
        {words.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {words.map(word => <WordChip key={word} word={word} found />)}
          </div>
        ) : (
          <span className="text-sm font-semibold text-faint">{t('gameOver.noWords')}</span>
        )}
      </div>

      <AdBanner />

      <div className="flex-1" />
      <div className="flex flex-col gap-2.5">
        <PrimaryButton onClick={onRestart} disabled={busy}>{t('gameOver.playAgain')}</PrimaryButton>
        <SecondaryButton onClick={onHome}>{t('gameOver.home')}</SecondaryButton>
      </div>
    </Screen>
  );
}
