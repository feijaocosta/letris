import { useEffect, useMemo, useState } from 'react';
import { LetrisGame } from './components/LetrisGame';
import { HomeScreen } from './components/HomeScreen';
import { GameChooser } from './components/GameChooser';
import { HelpScreen } from './components/HelpScreen';
import { UpdateBanner } from './components/UpdateBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ConsentBanner } from './components/ConsentBanner';
import type { ControlMode } from './components/LetrisUI';
import { usePWA } from './hooks/usePWA';
import { useLandscapePhone } from './hooks/useLandscapePhone';
import { RotateNotice } from './components/RotateNotice';
import { initAds } from './lib/ads';
import { track } from './lib/analytics';
import { applyConsent, getConsent, setConsent, type Consent } from './lib/consent';
import { KEYS, hasAnyRecord, load, save, type GameMode } from './lib/storage';
import { useI18n } from './lib/i18n';
import { loadWordLibrary } from './lib/wordBanks';
import type { WordLibrary } from './components/WordLibrary';
import {
  clearSavedEncaixe, clearSavedGame, loadSavedEncaixe, loadSavedGame, type SavedEncaixe, type SavedGame,
} from './lib/savedGame';
import { EncaixeGame } from './components/EncaixeGame';
import { ENCAIXE } from './config/encaixe';

export default function App() {
  const { isOnline, isStandalone } = usePWA();
  // Ao abrir: sempre a escolha do jogo (choose) → tela do jogo (home) → partida (game)
  const [screen, setScreen] = useState<'choose' | 'home' | 'game'>('choose');
  const [gameKey, setGameKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [controlMode, setControlModeState] = useState<ControlMode>(() => load(KEYS.controlMode, 'buttons'));
  const [consent, setConsentState] = useState<Consent>(getConsent);
  const [consentOpen, setConsentOpen] = useState(() => getConsent() === null);
  const { lang } = useI18n();
  const landscape = useLandscapePhone();
  // Banco de palavras da partida (do idioma escolhido)
  const [library, setLibrary] = useState<WordLibrary | null>(null);
  // Partida guardada a retomar na próxima tela de jogo
  const [resume, setResume] = useState<SavedGame | null>(null);
  // A próxima partida começa pelo tutorial
  const [withTutorial, setWithTutorial] = useState(false);
  // Modo de jogo escolhido na entrada (Clássico ou Encaixe), salvo no aparelho
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [resumeEncaixe, setResumeEncaixe] = useState<SavedEncaixe | null>(null);
  // Partida guardada do modo e idioma atuais, para o "Continuar" da entrada
  const saved = useMemo(() => {
    if (screen !== 'home') return null;
    return gameMode === 'encaixe' ? loadSavedEncaixe(lang, ENCAIXE.rows, ENCAIXE.cols) : loadSavedGame(lang);
  }, [screen, lang, gameMode]);

  // Partidas pela metade, para o selo "Em andamento" na escolha do jogo
  const inProgress = useMemo(() => ({
    classic: screen === 'choose' && loadSavedGame(lang) !== null,
    encaixe: screen === 'choose' && loadSavedEncaixe(lang, ENCAIXE.rows, ENCAIXE.cols) !== null,
  }), [screen, lang]);

  const chooseGame = (mode: GameMode) => {
    track('game_mode_select', { mode });
    setGameMode(mode);
    setScreen('home');
  };

  const setControlMode = (mode: ControlMode) => {
    if (mode !== controlMode) track('control_mode_change', { control_mode: mode });
    setControlModeState(mode);
  };

  const chooseConsent = (choice: 'granted' | 'denied') => {
    setConsent(choice);
    setConsentState(choice);
    setConsentOpen(false);
  };

  const openHelp = () => {
    track('help_open', { from: screen === 'game' ? 'jogo' : 'entrada' });
    setHelpOpen(true);
  };

  useEffect(() => {
    save(KEYS.controlMode, controlMode);
  }, [controlMode]);

  useEffect(() => {
    // Consentimento antes dos anúncios: define se podem ser personalizados
    applyConsent();
    initAds();
  }, []);

  // Convite para instalar: só na tela de entrada, nunca no meio da partida,
  // e depois de o jogador responder sobre os cookies
  useEffect(() => {
    if (screen !== 'choose' || isStandalone || consent === null || import.meta.env.DEV) return;
    const timer = setTimeout(() => setShowInstallPrompt(true), 4000);
    return () => clearTimeout(timer);
  }, [screen, isStandalone, consent]);

  useEffect(() => {
    // Prevent default touch behaviors that interfere with the game
    const preventDefault = (e: Event) => e.preventDefault();
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    // Prevent double-tap zoom / pinch zoom
    document.addEventListener('touchstart', preventMultiTouch, { passive: false });
    document.addEventListener('touchmove', preventMultiTouch, { passive: false });
    // Prevent context menu
    document.addEventListener('contextmenu', preventDefault);

    // Handle orientation change
    const handleOrientationChange = () => {
      setTimeout(() => window.scrollTo(0, 0), 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      document.removeEventListener('touchstart', preventMultiTouch);
      document.removeEventListener('touchmove', preventMultiTouch);
      document.removeEventListener('contextmenu', preventDefault);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Já carrega o banco do idioma na entrada, para o JOGAR começar na hora
  useEffect(() => {
    loadWordLibrary(lang).catch(() => {});
  }, [lang]);

  /**
   * Começa a partida: a guardada (Continuar), uma nova, ou o tutorial. O
   * tutorial aparece sozinho só na primeira vez de quem nunca jogou (sem
   * recorde); "Ver tutorial" no Como jogar força.
   */
  const play = async (game: SavedGame | SavedEncaixe | null = null, forceTutorial = false) => {
    let words: WordLibrary;
    try {
      words = await loadWordLibrary(lang);
    } catch {
      return; // sem banco (offline antes do primeiro carregamento): fica na entrada
    }
    // JOGAR/Novo jogo descarta a guardada do modo
    if (!game) (gameMode === 'encaixe' ? clearSavedEncaixe : clearSavedGame)(lang);
    track('game_start', { control_mode: controlMode, resumed: game !== null, mode: gameMode });
    if (gameMode === 'encaixe') {
      setResumeEncaixe(game as SavedEncaixe | null);
      setWithTutorial(false); // o tutorial é do Clássico
    } else {
      setResume(game as SavedGame | null);
      setWithTutorial(!game && (forceTutorial || (!load(KEYS.tutorialDone, false) && !hasAnyRecord())));
    }
    setLibrary(words);
    setConsentOpen(false);
    setShowInstallPrompt(false);
    setGameKey(k => k + 1);
    setScreen('game');
  };

  return (
    <>
      {screen === 'choose' ? (
        <GameChooser
          onChoose={chooseGame}
          inProgress={inProgress}
          onPrivacy={() => setConsentOpen(true)}
          isOnline={isOnline}
        />
      ) : screen === 'home' ? (
        <HomeScreen
          gameMode={gameMode}
          onBack={() => setScreen('choose')}
          controlMode={controlMode}
          onControlModeChange={setControlMode}
          onPlay={() => play()}
          saved={saved}
          onContinue={() => play(saved)}
          onHelp={openHelp}
        />
      ) : library && gameMode === 'encaixe' ? (
        <EncaixeGame
          key={gameKey}
          library={library}
          blocked={landscape}
          resume={resumeEncaixe}
          onHome={() => setScreen('choose')}
          onHelp={openHelp}
        />
      ) : library && (
        <LetrisGame
          key={gameKey}
          library={library}
          blocked={landscape}
          resume={resume}
          tutorial={withTutorial}
          controlMode={controlMode}
          onControlModeChange={setControlMode}
          onHome={() => setScreen('choose')}
          onHelp={openHelp}
        />
      )}

      {helpOpen && (
        <HelpScreen
          onClose={() => setHelpOpen(false)}
          // Só na entrada: no meio de uma partida o tutorial a abandonaria
          onTutorial={screen === 'home' && gameMode === 'classic' ? () => { setHelpOpen(false); play(null, true); } : undefined}
        />
      )}

      {consentOpen && screen === 'choose' && !helpOpen && (
        <ConsentBanner onAccept={() => chooseConsent('granted')} onDecline={() => chooseConsent('denied')} />
      )}

      {showInstallPrompt && screen === 'choose' && !consentOpen && (
        <PWAInstallPrompt
          onInstall={() => setShowInstallPrompt(false)}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      {landscape && <RotateNotice />}

      <UpdateBanner />
    </>
  );
}
