import type { ReactNode } from 'react';
import { IconBack, IconRotate, Panel, Tile } from './LetrisUI';
import { useI18n } from '../lib/i18n';
import type { GameMode } from '../lib/storage';

function HelpCard({ visual, title, children }: { visual: ReactNode; title: string; children: ReactNode }) {
  return (
    <Panel className="p-3.5 flex gap-3.5 items-center">
      <div className="shrink-0">{visual}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-black">{title}</span>
        <span className="text-[13px] font-semibold text-chip leading-snug">{children}</span>
      </div>
    </Panel>
  );
}

interface HelpScreenProps {
  /** Cada modo explica as suas regras e controles */
  gameMode?: GameMode;
  onClose: () => void;
  onTutorial?: () => void;
}

export function HelpScreen({ gameMode = 'classic', onClose, onTutorial }: HelpScreenProps) {
  const { t } = useI18n();
  const encaixe = gameMode === 'encaixe';
  return (
    <div className="fixed inset-0 z-40 bg-ink text-white safe-area">
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full w-full max-w-md mx-auto px-4 py-2 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 h-11">
            <button type="button" aria-label={t('common.back')} onClick={onClose}
              className="w-11 h-11 rounded-full bg-panel flex items-center justify-center">
              <IconBack size={22} />
            </button>
            <h1 className="m-0 text-2xl font-black">{t('common.howToPlay')}</h1>
          </div>

          <HelpCard
            title={t('help.wordsTitle')}
            visual={<div className="flex gap-[3px]">{[...t('help.wordsExample')].map((l, i) => <Tile key={i} letter={l} color="orange" size={30} className="tile-glow" />)}</div>}
          >
            {t('help.wordsText')}
          </HelpCard>

          {encaixe ? (
            <HelpCard
              title={t('help.encaixeLinesTitle')}
              visual={
                // Uma linha e uma coluna cheias brilhando
                <div className="grid grid-cols-4 gap-0.5">
                  {[
                    [null, 'green', null, null],
                    [null, 'green', 'blue', null],
                    ['red', 'green', 'yellow', 'blue'],
                    [null, 'green', null, 'orange'],
                  ].flatMap((row, r) => row.map((c, i) => c
                    ? <Tile key={`${r}-${i}`} color={c as 'green'} size={14} className={r === 2 || i === 1 ? 'tile-flash' : ''} />
                    : <div key={`${r}-${i}`} className="w-3.5 h-3.5" />))}
                </div>
              }
            >
              {t('help.encaixeLinesText')}
            </HelpCard>
          ) : (
          <HelpCard
            title={t('help.linesTitle')}
            visual={
              <div className="grid grid-cols-5 gap-0.5">
                {[null, 'green', null, null, 'blue'].map((c, i) => c
                  ? <Tile key={i} color={c as 'green' | 'blue'} size={14} />
                  : <div key={i} className="w-3.5 h-3.5" />)}
                {(['red', 'red', 'yellow', 'blue', 'blue'] as const).map((c, i) => <Tile key={`l${i}`} color={c} size={14} className="tile-flash" />)}
              </div>
            }
          >
            {t('help.linesText')}
          </HelpCard>
          )}

          <HelpCard
            title={t('help.goalTitle')}
            visual={
              <div className="relative w-[52px] h-[52px]">
                <svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="var(--color-ink)" strokeWidth="6" />
                  <circle cx="24" cy="24" r="19" fill="none" stroke="var(--color-tile-green)" strokeWidth="6" strokeLinecap="round" strokeDasharray="47.7 119.4" transform="rotate(-90 24 24)" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black">2/5</span>
              </div>
            }
          >
            {t('help.goalText')}
          </HelpCard>

          {encaixe ? (
            <Panel className="p-3.5 flex flex-col gap-2">
              <span className="text-base font-black">{t('help.encaixeControlsTitle')}</span>
              <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[13px] font-bold text-chip">
                {([
                  ['help.encaixeDrag', null],
                  ['help.encaixeCancel', null],
                  ['help.encaixeRotate', <IconRotate key="girar" size={13} />],
                  ['help.encaixeEnd', null],
                ] as const).map(([key, icon]) => (
                  <li key={key} className="flex items-center gap-2.5">
                    {/* O botão de girar aparece igual ao do jogo; os outros itens levam um ponto */}
                    <span className="shrink-0 w-8 flex justify-center">
                      {icon
                        ? <span className="h-5 px-2 rounded-full bg-white/90 text-ink flex items-center">{icon}</span>
                        : <span className="w-1.5 h-1.5 rounded-full bg-tile-yellow" />}
                    </span>
                    <span className="leading-snug">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
          <Panel className="p-3.5 flex flex-col gap-2.5">
            <span className="text-base font-black">{t('help.controlsTitle')}</span>
            <div className="grid grid-cols-2 gap-3 text-[13px] font-bold text-chip">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black tracking-wider text-tile-yellow">{t('help.buttonsTitle')}</span>
                <span>{t('help.buttonsMove')}</span>
                <span>{t('help.buttonsDown')}</span>
                <span>{t('help.buttonsRotate')}</span>
                <span>{t('help.buttonsDrop')}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black tracking-wider text-tile-yellow">{t('help.gesturesTitle')}</span>
                <span>{t('help.gesturesMove')}</span>
                <span>{t('help.gesturesRotate')}</span>
                <span>{t('help.gesturesDown')}</span>
                <span>{t('help.gesturesAlso')}</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-soft">{t('help.keyboard')}</span>
          </Panel>
          )}

          <div className="flex-1" />
          {onTutorial && (
            <button type="button" onClick={onTutorial}
              className="h-12 rounded-2xl bg-panel text-white text-[15px] font-extrabold">
              {t('help.tutorial')}
            </button>
          )}
          <button type="button" onClick={onClose}
            className="btn-3d h-14 rounded-[18px] bg-tile-green text-white text-lg font-black mb-2">
            {t('help.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
