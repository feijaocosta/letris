import { ControlModeToggle, IconBack, IconPlay, Label, Logo, StatCard, Tile, type ControlMode, type TileColor } from './LetrisUI';
import { load, recordKey, type GameMode } from '../lib/storage';
import { useI18n } from '../lib/i18n';

// Letras soltas de enfeite: [letra, cor, tamanho, esquerda %, topo %, rotação]
const DECOR: Array<[string, TileColor, number, number, number, number]> = [
  ['A', 'blue', 34, 6, 6, -12], ['E', 'red', 24, 46, 4, 6], ['O', 'orange', 28, 78, 9, 10],
  ['S', 'green', 38, 30, 14, -8], ['L', 'yellow', 30, 10, 30, 14], ['U', 'blue', 26, 66, 40, -16],
  ['R', 'green', 22, 22, 42, 20], ['N', 'orange', 30, 86, 52, -6], ['T', 'yellow', 34, -2, 54, 8],
];

// Tela do jogo escolhido (depois da escolha em GameChooser): recorde e melhor
// nível do jogo, Botões/Gestos (só no Clássico), JOGAR ou Continuar.

interface HomeScreenProps {
  gameMode: GameMode;
  /** Volta para a escolha do jogo */
  onBack: () => void;
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
  onPlay: () => void;
  /** Partida guardada do modo e idioma atuais (mostra "Continuar") */
  saved: { level: number; score: number } | null;
  onContinue: () => void;
  onHelp: () => void;
}

export function HomeScreen({ gameMode, onBack, controlMode, onControlModeChange, onPlay, saved, onContinue, onHelp }: HomeScreenProps) {
  const { t, n, lang } = useI18n();
  const bestScore = load(recordKey('bestScore', lang, gameMode), 0);
  const bestLevel = load(recordKey('bestLevel', lang, gameMode), 1);

  return (
    <div className="h-full w-full bg-ink text-white safe-area overflow-hidden">
      <div className="relative h-full w-full max-w-md mx-auto px-6 pt-2 pb-4 flex flex-col">
        <div className="absolute inset-x-0 top-0 h-3/5 pointer-events-none" aria-hidden="true">
          {DECOR.map(([letter, color, size, left, top, rotate]) => (
            <Tile key={letter} letter={letter} color={color} size={size}
              style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: `rotate(${rotate}deg)`, opacity: 0.22 }} />
          ))}
        </div>

        {/* Volta para a escolha do jogo */}
        <div className="relative flex items-center gap-2.5 h-11 shrink-0">
          <button type="button" aria-label={t('common.back')} onClick={onBack}
            className="w-11 h-11 rounded-full bg-panel flex items-center justify-center">
            <IconBack size={22} />
          </button>
        </div>

        <div className="relative flex-1 min-h-[100px] [@media(max-height:620px)]:min-h-[64px] flex flex-col items-center justify-center gap-3">
          <Logo size={40} gap={5} />
          <h1 className="m-0 text-[28px] font-black leading-tight">{t(gameMode === 'encaixe' ? 'modes.encaixe' : 'modes.classic')}</h1>
          <p className="m-0 text-[15px] font-bold text-soft text-center [@media(max-height:620px)]:hidden">
            {t(gameMode === 'encaixe' ? 'modes.encaixeText' : 'modes.classicText')}
          </p>
        </div>

        <div className="relative flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label={t('home.bestScore')} value={n(bestScore)} />
            <StatCard label={t('home.bestLevel')} value={bestLevel} />
          </div>

          {/* Botões/Gestos só existem no Clássico; no Encaixe a peça é arrastada */}
          {gameMode === 'classic' && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-center [@media(max-height:620px)]:hidden">{t('home.controls')}</Label>
              <ControlModeToggle value={controlMode} onChange={onControlModeChange} compact />
            </div>
          )}

          {saved ? (
            <>
              {/* Partida guardada: Continuar é o botão principal; "Novo jogo" descarta a guardada */}
              <button
                type="button"
                onClick={onContinue}
                className="btn-3d h-[68px] rounded-[20px] bg-tile-green text-white flex flex-col items-center justify-center leading-tight"
              >
                <span className="flex items-center gap-2.5 text-2xl font-black tracking-wide">
                  <IconPlay size={24} />
                  {t('home.continue')}
                </span>
                <span className="text-[13px] font-extrabold text-white/85">
                  {t('home.continueInfo', { level: saved.level, score: saved.score })}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={onPlay} className="h-[52px] rounded-2xl bg-panel text-white text-base font-extrabold">
                  {t('home.newGame')}
                </button>
                <button type="button" onClick={onHelp} className="h-[52px] rounded-2xl bg-panel text-white text-base font-extrabold">
                  {t('common.howToPlay')}
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
