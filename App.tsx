import { useEffect, useMemo, useState } from 'react';
import { LetrisGame } from './components/LetrisGame';
import { HomeScreen } from './components/HomeScreen';
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
import { KEYS, hasAnyRecord, load, save } from './lib/storage';
import { useI18n } from './lib/i18n';
import { loadWordLibrary } from './lib/wordBanks';
import type { WordLibrary } from './components/WordLibrary';
import { clearSavedGame, loadSavedGame, type SavedGame } from './lib/savedGame';

export default function App() {
  const { isOnline, isStandalone } = usePWA();
  const [screen, setScreen] = useState<'home' | 'game'>('home');
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
  // Partida guardada do idioma atual, para o "Continuar" da entrada
  const saved = useMemo(() => (screen === 'home' ? loadSavedGame(lang) : null), [screen, lang]);

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
    track('help_open', { from: screen === 'home' ? 'entrada' : 'jogo' });
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
    if (screen !== 'home' || isStandalone || consent === null || import.meta.env.DEV) return;
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
  const play = async (game: SavedGame | null = null, forceTutorial = false) => {
    let words: WordLibrary;
    try {
      words = await loadWordLibrary(lang);
    } catch {
      return; // sem banco (offline antes do primeiro carregamento): fica na entrada
    }
    if (!game) clearSavedGame(lang); // JOGAR/Novo jogo descarta a guardada
    track('game_start', { control_mode: controlMode, resumed: game !== null });
    setResume(game);
    setWithTutorial(!game && (forceTutorial || (!load(KEYS.tutorialDone, false) && !hasAnyRecord())));
    setLibrary(words);
    setConsentOpen(false);
    setShowInstallPrompt(false);
    setGameKey(k => k + 1);
    setScreen('game');
  };

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          controlMode={controlMode}
          onControlModeChange={setControlMode}
          onPlay={() => play()}
          saved={saved}
          onContinue={() => play(saved)}
          onHelp={openHelp}
          onPrivacy={() => setConsentOpen(true)}
          isOnline={isOnline}
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
          onHome={() => setScreen('home')}
          onHelp={openHelp}
        />
      )}

      {helpOpen && (
        <HelpScreen
          onClose={() => setHelpOpen(false)}
          // Só na entrada: no meio de uma partida o tutorial a abandonaria
          onTutorial={screen === 'home' ? () => { setHelpOpen(false); play(null, true); } : undefined}
        />
      )}

      {consentOpen && screen === 'home' && !helpOpen && (
        <ConsentBanner onAccept={() => chooseConsent('granted')} onDecline={() => chooseConsent('denied')} />
      )}

      {showInstallPrompt && screen === 'home' && !consentOpen && (
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
