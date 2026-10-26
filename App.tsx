import { useEffect, useState } from 'react';
import { LetrisGame } from './components/LetrisGame';
import { HomeScreen } from './components/HomeScreen';
import { HelpScreen } from './components/HelpScreen';
import { UpdateBanner } from './components/UpdateBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import type { ControlMode } from './components/LetrisUI';
import { usePWA } from './hooks/usePWA';
import { initAds } from './lib/ads';
import { KEYS, load, save } from './lib/storage';

export default function App() {
  const { isOnline, isStandalone } = usePWA();
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [gameKey, setGameKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [controlMode, setControlMode] = useState<ControlMode>(() => load(KEYS.controlMode, 'buttons'));

  useEffect(() => {
    save(KEYS.controlMode, controlMode);
  }, [controlMode]);

  useEffect(() => {
    initAds();
  }, []);

  // Convite para instalar: só na tela de entrada, nunca no meio da partida
  useEffect(() => {
    if (screen !== 'home' || isStandalone || import.meta.env.DEV) return;
    const timer = setTimeout(() => setShowInstallPrompt(true), 4000);
    return () => clearTimeout(timer);
  }, [screen, isStandalone]);

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

  const play = () => {
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
          onPlay={play}
          onHelp={() => setHelpOpen(true)}
          isOnline={isOnline}
        />
      ) : (
        <LetrisGame
          key={gameKey}
          controlMode={controlMode}
          onControlModeChange={setControlMode}
          onHome={() => setScreen('home')}
          onHelp={() => setHelpOpen(true)}
        />
      )}

      {helpOpen && <HelpScreen onClose={() => setHelpOpen(false)} />}

      {showInstallPrompt && screen === 'home' && (
        <PWAInstallPrompt
          onInstall={() => setShowInstallPrompt(false)}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      <UpdateBanner />
    </>
  );
}
