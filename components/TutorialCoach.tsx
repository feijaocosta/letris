import type { ReactNode } from 'react';
import { useI18n, type MessageKey } from '../lib/i18n';
import { ENCAIXE_TUTORIAL_STEPS, TUTORIAL_STEPS, type EncaixeTutorialStep, type TutorialStep } from '../config/tutorial';
import { IconSwipe, IconSwipeDown, IconTap, Logo, type ControlMode } from './LetrisUI';

// Balão do tutorial, por cima do tabuleiro. No Clássico fica no meio (as
// peças nascem em cima e as jogadas preparadas ficam embaixo) e, no modo
// Gestos, um ícone animado mostra o gesto do passo. O Encaixe usa o mesmo
// balão com os seus passos (EncaixeCoach).

const TEXT: Record<Exclude<TutorialStep, 'done'>, MessageKey | Record<ControlMode, MessageKey>> = {
  move: { buttons: 'tutorial.moveButtons', gestures: 'tutorial.moveGestures' },
  rotate: { buttons: 'tutorial.rotateButtons', gestures: 'tutorial.rotateGestures' },
  drop: { buttons: 'tutorial.dropButtons', gestures: 'tutorial.dropGestures' },
  word: 'tutorial.word',
  line: 'tutorial.line',
  goal: 'tutorial.goal',
};

const GESTURE: Partial<Record<TutorialStep, ReactNode>> = {
  move: <span className="inline-block animate-[tutorial-swipe_1.2s_ease-in-out_infinite]"><IconSwipe size={30} /></span>,
  rotate: <span className="inline-block animate-[tutorial-tap_1s_ease-in-out_infinite]"><IconTap size={30} /></span>,
  drop: <span className="inline-block animate-[tutorial-drag_1.2s_ease-in-out_infinite]"><IconSwipeDown size={30} /></span>,
};

interface TutorialCoachProps {
  step: Exclude<TutorialStep, 'done'>;
  controlMode: ControlMode;
  /** Variáveis dos textos ({word}, {letter}, {start}) */
  vars: Record<string, string>;
  retry: boolean;
  onSkip: () => void;
}

export function TutorialCoach({ step, controlMode, vars, retry, onSkip }: TutorialCoachProps) {
  const text = TEXT[step];
  return (
    <CoachBalloon
      step={step}
      index={TUTORIAL_STEPS.indexOf(step) + 1}
      total={TUTORIAL_STEPS.length - 1}
      text={typeof text === 'string' ? text : text[controlMode]}
      vars={vars}
      gesture={controlMode === 'gestures' ? GESTURE[step] : null}
      retry={retry}
      onSkip={onSkip}
      className="top-[28%]"
    />
  );
}

const ENCAIXE_TEXT: Record<Exclude<EncaixeTutorialStep, 'done'>, MessageKey> = {
  drag: 'tutorial.encaixeDrag',
  rotate: 'tutorial.encaixeRotate',
  word: 'tutorial.encaixeWord',
  line: 'tutorial.encaixeLine',
  goal: 'tutorial.encaixeGoal',
};

/** Balão do tutorial do Encaixe: no alto do tabuleiro (as jogadas ficam embaixo) */
export function EncaixeCoach({ step, vars, retry, onSkip }: {
  step: Exclude<EncaixeTutorialStep, 'done'>;
  vars: Record<string, string>;
  retry: boolean;
  onSkip: () => void;
}) {
  return (
    <CoachBalloon
      step={step}
      index={ENCAIXE_TUTORIAL_STEPS.indexOf(step) + 1}
      total={ENCAIXE_TUTORIAL_STEPS.length - 1}
      text={ENCAIXE_TEXT[step]}
      vars={vars}
      retry={retry}
      onSkip={onSkip}
      className="top-2"
    />
  );
}

interface CoachBalloonProps {
  step: string;
  index: number;
  total: number;
  text: MessageKey;
  vars: Record<string, string>;
  gesture?: ReactNode;
  retry: boolean;
  onSkip: () => void;
  /** Posição no tabuleiro (top-*) */
  className: string;
}

function CoachBalloon({ step, index, total, text: key, vars, gesture, retry, onSkip, className }: CoachBalloonProps) {
  const { t } = useI18n();
  return (
    <div className={`pointer-events-none absolute inset-x-1 ${className} flex justify-center`} data-tutorial-step={step}>
      <div
        className="pointer-events-none w-full max-w-[300px] bg-ink/95 border-2 border-tile-yellow rounded-2xl px-3.5 py-3 flex flex-col gap-2 shadow-xl animate-[pop-in_.25s_ease-out_both]"
        role="status"
        key={`${step}-${retry}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold tracking-wider text-tile-yellow">
            {t('tutorial.counter', { n: index, total })}
          </span>
          <button type="button" onClick={onSkip} className="pointer-events-auto min-h-0 min-w-0 px-1 text-xs font-extrabold text-soft underline">
            {t('tutorial.skip')}
          </button>
        </div>
        {retry && <span className="text-[13px] font-black text-tile-orange">{t('tutorial.retry')}</span>}
        <div className="flex items-center gap-3">
          {gesture && <span className="shrink-0 text-tile-yellow">{gesture}</span>}
          <p className="m-0 text-[15px] font-bold leading-snug text-white">{t(key, vars)}</p>
        </div>
      </div>
    </div>
  );
}

/** "Agora é com você!": depois dele o tabuleiro é limpo e começa o nível 1 */
export function TutorialDone({ onStart, text = 'tutorial.doneText' }: { onStart: () => void; text?: MessageKey }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-30 bg-ink/90 safe-area flex items-center justify-center px-6 animate-[fade-in_.25s_ease-out]">
      <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center animate-[pop-in_.35s_ease-out_both]">
        <Logo size={30} gap={4} />
        <h1 className="m-0 text-[30px] font-black leading-tight">{t('tutorial.doneTitle')}</h1>
        <p className="m-0 text-base font-bold text-soft">{t(text)}</p>
        <button
          type="button"
          onClick={onStart}
          className="btn-3d w-full h-[60px] rounded-[18px] bg-tile-green text-white text-xl font-black"
        >
          {t('tutorial.doneStart')}
        </button>
      </div>
    </div>
  );
}
